from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models import CounterLog
from app.routes.helpers import get_counter_or_404, get_group_or_404

router = APIRouter(tags=["logs"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/groups/{group_id}/logs", response_model=list[CounterLog])
def list_group_logs(
    group_id: str,
    session: SessionDep,
    limit: int = 80,
    offset: int = 0,
) -> list[CounterLog]:
    get_group_or_404(session, group_id)
    capped_limit = min(max(limit, 1), 50)
    safe_offset = max(offset, 0)
    statement = (
        select(CounterLog)
        .where(CounterLog.group_id == group_id)
        .order_by(CounterLog.created_at.desc())
        .limit(capped_limit)
        .offset(safe_offset)
    )
    return list(session.exec(statement).all())


@router.get("/counters/{counter_id}/logs", response_model=list[CounterLog])
def list_counter_logs(
    counter_id: str,
    session: SessionDep,
    limit: int = 80,
    offset: int = 0,
) -> list[CounterLog]:
    get_counter_or_404(session, counter_id)
    capped_limit = min(max(limit, 1), 50)
    safe_offset = max(offset, 0)
    statement = (
        select(CounterLog)
        .where(CounterLog.counter_id == counter_id)
        .order_by(CounterLog.created_at.desc())
        .limit(capped_limit)
        .offset(safe_offset)
    )
    return list(session.exec(statement).all())
