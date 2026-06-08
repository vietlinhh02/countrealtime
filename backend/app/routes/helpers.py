from fastapi import HTTPException
from sqlmodel import Session

from app.models import Counter, CounterLog, Group, LogAction, now_utc


def get_group_or_404(session: Session, group_id: str) -> Group:
    group = session.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail=f"Group {group_id} was not found")
    return group


def get_counter_or_404(session: Session, counter_id: str) -> Counter:
    counter = session.get(Counter, counter_id)
    if counter is None:
        raise HTTPException(status_code=404, detail=f"Counter {counter_id} was not found")
    return counter


def write_log(
    session: Session,
    *,
    group_id: str,
    counter_id: str | None,
    actor_name: str,
    action: LogAction,
    message: str,
    old_value: int | None = None,
    new_value: int | None = None,
    delta: int | None = None,
) -> CounterLog:
    log = CounterLog(
        group_id=group_id,
        counter_id=counter_id,
        actor_name=actor_name.strip(),
        action=action,
        old_value=old_value,
        new_value=new_value,
        delta=delta,
        message=message,
        created_at=now_utc(),
    )
    session.add(log)
    return log
