from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select

from app.database import get_session
from app.models import Counter, CounterLog, Group, LogAction, now_utc
from app.realtime import hub
from app.routes.helpers import get_group_or_404, write_log
from app.schemas import GroupCreate, GroupDetail, GroupRead, GroupRename, LogRead

router = APIRouter(prefix="/groups", tags=["groups"])
SessionDep = Annotated[Session, Depends(get_session)]


def _group_read(session: Session, group: Group) -> GroupRead:
    statement = select(func.count(Counter.id)).where(Counter.group_id == group.id)
    count = session.exec(statement).one()
    return GroupRead.model_validate(group).model_copy(update={"counter_count": count})


@router.get("", response_model=list[GroupRead])
def list_groups(session: SessionDep) -> list[GroupRead]:
    groups = session.exec(select(Group).order_by(Group.updated_at.desc())).all()
    return [_group_read(session, group) for group in groups]


@router.post("", response_model=GroupRead, status_code=201)
async def create_group(payload: GroupCreate, session: SessionDep) -> GroupRead:
    group = Group(name=payload.name.strip(), created_by_name=payload.actor_name.strip())
    session.add(group)
    session.flush()
    log = write_log(
        session,
        group_id=group.id,
        counter_id=None,
        actor_name=payload.actor_name,
        action=LogAction.group_created,
        message=f"{payload.actor_name.strip()} created group {group.name}",
    )
    session.commit()
    session.refresh(group)
    session.refresh(log)
    result = _group_read(session, group)
    event = {
        "type": "group_created",
        "group": result.model_dump(mode="json"),
        "log": LogRead.model_validate(log).model_dump(mode="json"),
    }
    await hub.broadcast(event)
    return result


@router.get("/{group_id}", response_model=GroupDetail)
def get_group_detail(group_id: str, session: SessionDep) -> GroupDetail:
    group = get_group_or_404(session, group_id)
    counters = session.exec(select(Counter).where(Counter.group_id == group.id)).all()
    logs = session.exec(
        select(CounterLog)
        .where(CounterLog.group_id == group.id)
        .order_by(CounterLog.created_at.desc())
        .limit(50)
    ).all()
    return GroupDetail(
        group=_group_read(session, group),
        counters=list(counters),
        logs=list(logs),
    )


@router.patch("/{group_id}", response_model=GroupRead)
async def rename_group(
    group_id: str,
    payload: GroupRename,
    session: SessionDep,
) -> GroupRead:
    group = get_group_or_404(session, group_id)
    old_name = group.name
    group.name = payload.name.strip()
    group.updated_at = now_utc()
    log = write_log(
        session,
        group_id=group.id,
        counter_id=None,
        actor_name=payload.actor_name,
        action=LogAction.group_renamed,
        message=f"{payload.actor_name.strip()} renamed group {old_name} to {group.name}",
    )
    session.add(group)
    session.commit()
    session.refresh(group)
    session.refresh(log)
    result = _group_read(session, group)
    event = {
        "type": "group_renamed",
        "group": result.model_dump(mode="json"),
        "log": LogRead.model_validate(log).model_dump(mode="json"),
    }
    await hub.broadcast(event)
    return result


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: str,
    actor_name: str,
    session: SessionDep,
) -> None:
    group = get_group_or_404(session, group_id)
    group_name = group.name
    counters = session.exec(select(Counter).where(Counter.group_id == group.id)).all()
    for counter in counters:
        session.delete(counter)
    log = write_log(
        session,
        group_id=group.id,
        counter_id=None,
        actor_name=actor_name,
        action=LogAction.group_deleted,
        message=f"{actor_name.strip()} deleted group {group_name}",
    )
    session.delete(group)
    session.commit()
    session.refresh(log)
    event = {
        "type": "group_deleted",
        "group_id": group_id,
        "log": LogRead.model_validate(log).model_dump(mode="json"),
    }
    await hub.broadcast(event)
