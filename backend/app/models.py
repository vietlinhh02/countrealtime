from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlmodel import Field, SQLModel


def now_utc() -> datetime:
    return datetime.now(UTC)


def new_id() -> str:
    return uuid4().hex


class LogAction(StrEnum):
    group_created = "group_created"
    group_renamed = "group_renamed"
    group_deleted = "group_deleted"
    counter_created = "counter_created"
    counter_renamed = "counter_renamed"
    counter_deleted = "counter_deleted"
    counter_incremented = "counter_incremented"
    counter_decremented = "counter_decremented"


class Group(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    name: str = Field(index=True, min_length=1, max_length=80)
    created_by_name: str = Field(min_length=1, max_length=80)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class Counter(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    group_id: str = Field(index=True, foreign_key="group.id")
    name: str = Field(index=True, min_length=1, max_length=80)
    value: int = 0
    created_by_name: str = Field(min_length=1, max_length=80)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class CounterLog(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    group_id: str = Field(index=True, foreign_key="group.id")
    counter_id: str | None = Field(default=None, index=True, foreign_key="counter.id")
    actor_name: str = Field(min_length=1, max_length=80)
    action: LogAction = Field(index=True)
    old_value: int | None = None
    new_value: int | None = None
    delta: int | None = None
    message: str = Field(max_length=240)
    created_at: datetime = Field(default_factory=now_utc, index=True)
