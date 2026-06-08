from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import update
from sqlmodel import Session, select

from app.database import get_session
from app.models import Counter, Group, LogAction, now_utc
from app.realtime import hub
from app.routes.helpers import get_counter_or_404, get_group_or_404, write_log
from app.schemas import ActorRequest, CounterCreate, CounterRead, CounterRename, LogRead

router = APIRouter(tags=["counters"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/groups/{group_id}/counters", response_model=list[CounterRead])
def list_counters(group_id: str, session: SessionDep) -> list[Counter]:
    get_group_or_404(session, group_id)
    statement = select(Counter).where(Counter.group_id == group_id).order_by(Counter.created_at)
    return list(session.exec(statement).all())


@router.post("/groups/{group_id}/counters", response_model=CounterRead, status_code=201)
async def create_counter(
    group_id: str,
    payload: CounterCreate,
    session: SessionDep,
) -> Counter:
    group = get_group_or_404(session, group_id)
    counter = Counter(
        group_id=group.id,
        name=payload.name.strip(),
        created_by_name=payload.actor_name.strip(),
    )
    group.updated_at = now_utc()
    session.add(counter)
    session.add(group)
    session.flush()
    log = write_log(
        session,
        group_id=group.id,
        counter_id=counter.id,
        actor_name=payload.actor_name,
        action=LogAction.counter_created,
        message=f"{payload.actor_name.strip()} created counter {counter.name}",
    )
    session.commit()
    session.refresh(counter)
    session.refresh(log)
    event = {
        "type": "counter_created",
        "counter": CounterRead.model_validate(counter).model_dump(mode="json"),
        "log": LogRead.model_validate(log).model_dump(mode="json"),
    }
    await hub.broadcast(event)
    return counter


@router.patch("/counters/{counter_id}", response_model=CounterRead)
async def rename_counter(
    counter_id: str,
    payload: CounterRename,
    session: SessionDep,
) -> Counter:
    counter = get_counter_or_404(session, counter_id)
    group = session.get(Group, counter.group_id)
    old_name = counter.name
    counter.name = payload.name.strip()
    counter.updated_at = now_utc()
    if group is not None:
        group.updated_at = counter.updated_at
        session.add(group)
    log = write_log(
        session,
        group_id=counter.group_id,
        counter_id=counter.id,
        actor_name=payload.actor_name,
        action=LogAction.counter_renamed,
        message=f"{payload.actor_name.strip()} renamed counter {old_name} to {counter.name}",
    )
    session.add(counter)
    session.commit()
    session.refresh(counter)
    session.refresh(log)
    event = {
        "type": "counter_renamed",
        "counter": CounterRead.model_validate(counter).model_dump(mode="json"),
        "log": LogRead.model_validate(log).model_dump(mode="json"),
    }
    await hub.broadcast(event)
    return counter


@router.delete("/counters/{counter_id}", status_code=204)
async def delete_counter(
    counter_id: str,
    actor_name: str,
    session: SessionDep,
) -> None:
    counter = get_counter_or_404(session, counter_id)
    group_id = counter.group_id
    counter_name = counter.name
    counter_value = counter.value
    group = session.get(Group, group_id)
    if group is not None:
        group.updated_at = now_utc()
        session.add(group)
    log = write_log(
        session,
        group_id=group_id,
        counter_id=counter_id,
        actor_name=actor_name,
        action=LogAction.counter_deleted,
        message=f"{actor_name.strip()} deleted counter {counter_name} (was {counter_value})",
    )
    session.delete(counter)
    session.commit()
    session.refresh(log)
    event = {
        "type": "counter_deleted",
        "counter_id": counter_id,
        "group_id": group_id,
        "log": LogRead.model_validate(log).model_dump(mode="json"),
    }
    await hub.broadcast(event)


@router.post("/counters/{counter_id}/increment", response_model=CounterRead)
async def increment_counter(
    counter_id: str,
    payload: ActorRequest,
    session: SessionDep,
) -> Counter:
    return await _change_counter(counter_id, payload.actor_name, 1, session)


@router.post("/counters/{counter_id}/decrement", response_model=CounterRead)
async def decrement_counter(
    counter_id: str,
    payload: ActorRequest,
    session: SessionDep,
) -> Counter:
    return await _change_counter(counter_id, payload.actor_name, -1, session)


async def _change_counter(
    counter_id: str,
    actor_name: str,
    delta: int,
    session: Session,
) -> Counter:
    counter = get_counter_or_404(session, counter_id)
    group = session.get(Group, counter.group_id)
    old_value = counter.value
    new_value = old_value + delta
    action = LogAction.counter_incremented if delta > 0 else LogAction.counter_decremented
    verb = "increased" if delta > 0 else "decreased"
    now = now_utc()
    if group is not None:
        group.updated_at = now
        session.add(group)
    session.exec(
        update(Counter)
        .where(Counter.id == counter_id)
        .values(value=Counter.value + delta, updated_at=now)
    )
    log = write_log(
        session,
        group_id=counter.group_id,
        counter_id=counter.id,
        actor_name=actor_name,
        action=action,
        old_value=old_value,
        new_value=new_value,
        delta=delta,
        message=f"{actor_name.strip()} {verb} {counter.name} to {new_value}",
    )
    session.commit()
    session.refresh(counter)
    session.refresh(log)
    event = {
        "type": "counter_updated",
        "counter": CounterRead.model_validate(counter).model_dump(mode="json"),
        "log": LogRead.model_validate(log).model_dump(mode="json"),
    }
    await hub.broadcast(event)
    return counter
