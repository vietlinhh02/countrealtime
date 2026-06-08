from fastapi import WebSocket


class RealtimeHub:
    """Tracks connected clients and broadcasts JSON events."""

    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._clients.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.discard(websocket)

    async def broadcast(self, event: dict[str, object]) -> None:
        disconnected: list[WebSocket] = []
        for client in self._clients:
            try:
                await client.send_json(event)
            except RuntimeError:
                disconnected.append(client)
        for client in disconnected:
            self.disconnect(client)


hub = RealtimeHub()
