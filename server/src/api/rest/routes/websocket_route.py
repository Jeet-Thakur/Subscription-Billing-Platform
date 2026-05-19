from fastapi import APIRouter, WebSocket

from src.core.services.websocket_service import handle_message
from src.utils.websocket.connection_manager import manager


router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            response = f"Server received: {data}"

            await manager.send_personal_message(response, websocket)

    except Exception:
        manager.disconnect(websocket)