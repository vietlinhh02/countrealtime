from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import LogAction


class ActorRequest(BaseModel):
    actor_name: str = Field(min_length=1, max_length=80)


class GroupCreate(ActorRequest):
    name: str = Field(min_length=1, max_length=80)


class GroupRename(ActorRequest):
    name: str = Field(min_length=1, max_length=80)


class CounterCreate(ActorRequest):
    name: str = Field(min_length=1, max_length=80)
    parent_id: str | None = None


class CounterRename(ActorRequest):
    name: str = Field(min_length=1, max_length=80)


class GroupRead(BaseModel):
    id: str
    name: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime
    counter_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class CounterRead(BaseModel):
    id: str
    group_id: str
    parent_id: str | None = None
    name: str
    value: int
    created_by_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LogRead(BaseModel):
    id: str
    group_id: str
    counter_id: str | None
    actor_name: str
    action: LogAction
    old_value: int | None
    new_value: int | None
    delta: int | None
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupDetail(BaseModel):
    group: GroupRead
    counters: list[CounterRead]
    logs: list[LogRead]
