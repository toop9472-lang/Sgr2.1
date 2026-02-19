# WebSocket Routes for Real-time Multiplayer Gaming
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime, timezone
import uuid

router = APIRouter(tags=["WebSocket"])

# Game rooms storage
class GameRoom:
    def __init__(self, room_id: str, game_type: str, host_id: str):
        self.room_id = room_id
        self.game_type = game_type
        self.host_id = host_id
        self.players: Dict[str, WebSocket] = {}
        self.game_state = {}
        self.created_at = datetime.now(timezone.utc)
        self.status = "waiting"  # waiting, playing, finished

class GameManager:
    def __init__(self):
        self.rooms: Dict[str, GameRoom] = {}
        self.player_rooms: Dict[str, str] = {}  # player_id -> room_id
        self.waiting_players: Dict[str, List[tuple]] = {  # game_type -> [(player_id, ws)]
            "tictactoe": [],
            "chess": [],
            "puzzle": [],
        }
    
    async def create_room(self, game_type: str, host_id: str, host_ws: WebSocket) -> GameRoom:
        room_id = str(uuid.uuid4())[:8]
        room = GameRoom(room_id, game_type, host_id)
        room.players[host_id] = host_ws
        self.rooms[room_id] = room
        self.player_rooms[host_id] = room_id
        return room
    
    async def join_room(self, room_id: str, player_id: str, player_ws: WebSocket) -> Optional[GameRoom]:
        if room_id not in self.rooms:
            return None
        
        room = self.rooms[room_id]
        if len(room.players) >= 2:
            return None
            
        room.players[player_id] = player_ws
        self.player_rooms[player_id] = room_id
        
        if len(room.players) == 2:
            room.status = "playing"
            
        return room
    
    async def find_match(self, game_type: str, player_id: str, player_ws: WebSocket) -> Optional[GameRoom]:
        # Check if there's a waiting player
        if self.waiting_players.get(game_type) and len(self.waiting_players[game_type]) > 0:
            # Match found!
            opponent_id, opponent_ws = self.waiting_players[game_type].pop(0)
            
            # Create room with the waiting player as host
            room = await self.create_room(game_type, opponent_id, opponent_ws)
            await self.join_room(room.room_id, player_id, player_ws)
            
            return room
        else:
            # No match, add to waiting list
            self.waiting_players[game_type].append((player_id, player_ws))
            return None
    
    async def leave_room(self, player_id: str):
        if player_id in self.player_rooms:
            room_id = self.player_rooms[player_id]
            if room_id in self.rooms:
                room = self.rooms[room_id]
                if player_id in room.players:
                    del room.players[player_id]
                
                # If room empty, delete it
                if len(room.players) == 0:
                    del self.rooms[room_id]
                else:
                    # Notify other player
                    for pid, ws in room.players.items():
                        try:
                            await ws.send_json({
                                "type": "player_left",
                                "player_id": player_id
                            })
                        except:
                            pass
            
            del self.player_rooms[player_id]
        
        # Remove from waiting lists
        for game_type, waiting in self.waiting_players.items():
            self.waiting_players[game_type] = [(pid, ws) for pid, ws in waiting if pid != player_id]
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_player: str = None):
        if room_id not in self.rooms:
            return
            
        room = self.rooms[room_id]
        for player_id, ws in room.players.items():
            if player_id != exclude_player:
                try:
                    await ws.send_json(message)
                except:
                    pass

game_manager = GameManager()

@router.websocket("/ws/game/{player_id}")
async def game_websocket(websocket: WebSocket, player_id: str):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "find_match":
                game_type = data.get("game_type", "tictactoe")
                room = await game_manager.find_match(game_type, player_id, websocket)
                
                if room:
                    # Match found! Notify both players
                    players = list(room.players.keys())
                    for pid, ws in room.players.items():
                        await ws.send_json({
                            "type": "match_found",
                            "room_id": room.room_id,
                            "players": players,
                            "your_turn": pid == room.host_id,
                            "game_type": room.game_type
                        })
                else:
                    # Waiting for opponent
                    await websocket.send_json({
                        "type": "waiting",
                        "message": "جاري البحث عن منافس..."
                    })
            
            elif action == "cancel_search":
                await game_manager.leave_room(player_id)
                await websocket.send_json({
                    "type": "search_cancelled"
                })
            
            elif action == "game_move":
                room_id = game_manager.player_rooms.get(player_id)
                if room_id:
                    move_data = data.get("move", {})
                    await game_manager.broadcast_to_room(room_id, {
                        "type": "opponent_move",
                        "move": move_data,
                        "player_id": player_id
                    }, exclude_player=player_id)
            
            elif action == "game_end":
                room_id = game_manager.player_rooms.get(player_id)
                if room_id:
                    result = data.get("result", {})
                    await game_manager.broadcast_to_room(room_id, {
                        "type": "game_ended",
                        "result": result,
                        "winner": data.get("winner")
                    })
                    
                    # Clean up room
                    if room_id in game_manager.rooms:
                        game_manager.rooms[room_id].status = "finished"
            
            elif action == "chat":
                room_id = game_manager.player_rooms.get(player_id)
                if room_id:
                    message = data.get("message", "")
                    await game_manager.broadcast_to_room(room_id, {
                        "type": "chat_message",
                        "player_id": player_id,
                        "message": message
                    }, exclude_player=player_id)
            
            elif action == "rematch":
                room_id = game_manager.player_rooms.get(player_id)
                if room_id:
                    await game_manager.broadcast_to_room(room_id, {
                        "type": "rematch_request",
                        "player_id": player_id
                    }, exclude_player=player_id)
            
            elif action == "accept_rematch":
                room_id = game_manager.player_rooms.get(player_id)
                if room_id and room_id in game_manager.rooms:
                    room = game_manager.rooms[room_id]
                    room.status = "playing"
                    room.game_state = {}
                    
                    await game_manager.broadcast_to_room(room_id, {
                        "type": "rematch_accepted",
                        "room_id": room_id
                    })
    
    except WebSocketDisconnect:
        await game_manager.leave_room(player_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await game_manager.leave_room(player_id)


@router.get("/api/game/online-players")
async def get_online_players():
    """Get count of online players"""
    total_waiting = sum(len(waiting) for waiting in game_manager.waiting_players.values())
    total_playing = sum(len(room.players) for room in game_manager.rooms.values() if room.status == "playing")
    
    return {
        "waiting": total_waiting,
        "playing": total_playing,
        "total": total_waiting + total_playing,
        "rooms": len(game_manager.rooms)
    }
