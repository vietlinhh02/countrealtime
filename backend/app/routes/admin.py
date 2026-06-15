from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, delete, select

from app.config import settings
from app.database import get_session
from app.models import Counter, CounterLog, Group, LogAction, now_utc
from app.realtime import hub
from app.routes.helpers import write_log
from app.schemas import CounterRead, GroupRead

router = APIRouter(prefix="/admin", tags=["admin"])
SessionDep = Annotated[Session, Depends(get_session)]


class ResetSessionRequest(BaseModel):
    actor_name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class ResetSessionResponse(BaseModel):
    group: GroupRead
    counters: list[CounterRead]


@router.post("/reset-session", response_model=ResetSessionResponse)
async def reset_session(payload: ResetSessionRequest, session: SessionDep) -> ResetSessionResponse:
    """Atomically wipe the database and recreate a default group with 30 counters.

    Requires the admin password so random clients cannot nuke the workspace.
    """
    if payload.password != settings.admin_password:
        raise HTTPException(status_code=403, detail="Sai mật khẩu admin")

    actor = payload.actor_name.strip()

    # 1. Snapshot existing group ids BEFORE delete so we can broadcast deletes.
    existing_group_ids = [
        group.id
        for group in session.exec(select(Group)).all()
    ]

    # 2. Wipe everything. SQLite cascades via FK only if PRAGMA foreign_keys=ON,
    #    so delete children explicitly to be safe.
    session.exec(delete(CounterLog))
    session.exec(delete(Counter))
    session.exec(delete(Group))
    session.flush()

    now = now_utc()

    # 3. Recreate default group.
    group = Group(
        name="Nhóm 1",
        created_by_name=actor,
        created_at=now,
        updated_at=now,
    )
    session.add(group)
    session.flush()

    # 4. Bulk create 30 counters Q01..Q30.
    counters: list[Counter] = []
    for i in range(1, 31):
        counter = Counter(
            group_id=group.id,
            parent_id=None,
            name=f"Q{i:02d}",
            value=0,
            created_by_name=actor,
            created_at=now,
            updated_at=now,
        )
        counters.append(counter)
        session.add(counter)
    session.flush()

    # 5. Single log entry summarising the reset.
    reset_message = (
        f"{actor} đã reset phiên: xóa {len(existing_group_ids)} nhóm cũ, "
        "tạo nhóm mới với 30 bộ đếm"
    )
    log = write_log(
        session,
        group_id=group.id,
        counter_id=None,
        actor_name=actor,
        action=LogAction.group_created,
        message=reset_message,
    )
    session.add(log)
    session.commit()

    for counter in counters:
        session.refresh(counter)
    session.refresh(group)
    session.refresh(log)

    # 6. Broadcast deletes for old groups first so clients clear state.
    for old_id in existing_group_ids:
        await hub.broadcast({"type": "group_deleted", "group_id": old_id})

    # 7. Broadcast the new group so other tabs refresh.
    group_read = GroupRead(
        id=group.id,
        name=group.name,
        created_by_name=group.created_by_name,
        created_at=group.created_at,
        updated_at=group.updated_at,
        counter_count=len(counters),
    )
    await hub.broadcast(
        {
            "type": "session_reset",
            "group": group_read.model_dump(mode="json"),
            "counter_ids": [counter.id for counter in counters],
        }
    )

    counter_reads = [CounterRead.model_validate(counter) for counter in counters]
    return ResetSessionResponse(group=group_read, counters=counter_reads)
