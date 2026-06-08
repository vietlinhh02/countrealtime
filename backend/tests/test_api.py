from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.database import get_session
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SQLModel.metadata.create_all(engine)


def session_override() -> Generator[Session]:
    with Session(engine) as session:
        yield session


app.dependency_overrides[get_session] = session_override
client = TestClient(app)


def test_counter_flow_writes_logs() -> None:
    group_response = client.post(
        "/groups",
        json={"name": "Ca sang", "actor_name": "Linh"},
    )
    assert group_response.status_code == 201
    group = group_response.json()

    counter_response = client.post(
        f"/groups/{group['id']}/counters",
        json={"name": "Khach vao", "actor_name": "Eddie"},
    )
    assert counter_response.status_code == 201
    counter = counter_response.json()

    increment_response = client.post(
        f"/counters/{counter['id']}/increment",
        json={"actor_name": "Linh"},
    )
    assert increment_response.status_code == 200
    assert increment_response.json()["value"] == 1

    decrement_response = client.post(
        f"/counters/{counter['id']}/decrement",
        json={"actor_name": "Eddie"},
    )
    assert decrement_response.status_code == 200
    assert decrement_response.json()["value"] == 0

    logs_response = client.get(f"/groups/{group['id']}/logs")
    assert logs_response.status_code == 200
    logs = logs_response.json()
    assert [log["action"] for log in logs] == [
        "counter_decremented",
        "counter_incremented",
        "counter_created",
        "group_created",
    ]
    assert logs[0]["old_value"] == 1
    assert logs[0]["new_value"] == 0
