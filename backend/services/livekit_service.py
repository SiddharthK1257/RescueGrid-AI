import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from backend.config import config
from backend.models.schemas import LiveKitTokenResponse

logger = logging.getLogger("rescuegrid.livekit")

class LiveKitService:
    def __init__(self):
        self.api_key = config.LIVEKIT_API_KEY
        self.api_secret = config.LIVEKIT_API_SECRET
        self.url = config.LIVEKIT_URL
        self._active_rooms: Dict[str, Dict[str, Any]] = {}

    def generate_token(
        self,
        room_name: str,
        participant_name: str,
        participant_identity: Optional[str] = None,
        is_admin: bool = False
    ) -> LiveKitTokenResponse:
        """
        Generate temporary, cryptographically signed LiveKit room JWT token on server.
        """
        identity = participant_identity or f"user_{int(time.time())}_{participant_name.lower().replace(' ', '_')}"
        expires_delta = timedelta(hours=2)
        expires_at = (datetime.utcnow() + expires_delta).isoformat()
        
        is_demo_fallback = False
        token_str = ""

        try:
            from livekit.api import AccessToken, VideoGrants
            grant = VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
                room_admin=is_admin
            )
            token = (
                AccessToken(self.api_key, self.api_secret)
                .with_identity(identity)
                .with_name(participant_name)
                .with_grants(grant)
                .with_ttl(expires_delta)
            )
            token_str = token.to_jwt()
            logger.info(f"Generated LiveKit token for {participant_name} in room {room_name}")
        except Exception as e:
            logger.warning(f"LiveKit SDK token generation warning: {e}. Generating secure demo JWT fallback.")
            import jwt
            payload = {
                "sub": identity,
                "name": participant_name,
                "video": {
                    "room": room_name,
                    "roomJoin": True,
                    "canPublish": True,
                    "canSubscribe": True
                },
                "iss": self.api_key,
                "exp": int((datetime.utcnow() + expires_delta).timestamp())
            }
            token_str = jwt.encode(payload, self.api_secret, algorithm="HS256")
            is_demo_fallback = True

        # Track active room in state
        if room_name not in self._active_rooms:
            self._active_rooms[room_name] = {
                "roomName": room_name,
                "createdAt": datetime.utcnow().isoformat(),
                "participants": [],
                "voiceSessionActive": True
            }
        
        participants = self._active_rooms[room_name]["participants"]
        if not any(p.get("identity") == identity for p in participants):
            participants.append({
                "identity": identity,
                "name": participant_name,
                "role": "COMMANDER" if is_admin else "OPERATOR",
                "joinedAt": datetime.utcnow().isoformat(),
                "isMuted": False
            })

        return LiveKitTokenResponse(
            token=token_str,
            roomName=room_name,
            participantName=participant_name,
            livekitUrl=self.url,
            expiresAt=expires_at,
            isDemoFallback=is_demo_fallback
        )

    def get_room_status(self, room_name: str) -> Dict[str, Any]:
        room = self._active_rooms.get(room_name)
        if not room:
            return {
                "roomName": room_name,
                "status": "IDLE",
                "participants": [],
                "participantCount": 0,
                "voiceActive": False,
                "serverUrl": self.url
            }
        return {
            "roomName": room_name,
            "status": "ACTIVE",
            "participants": room["participants"],
            "participantCount": len(room["participants"]),
            "voiceActive": True,
            "serverUrl": self.url
        }

livekit_service = LiveKitService()
