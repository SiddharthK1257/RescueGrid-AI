import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Config(BaseModel):
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DB_USERNAME: str = os.getenv("DB_USERNAME", "admin")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "rescuegrid-jwt-secret-key-3f98a2e1d054bc-2026")
    MOSS_API_KEY: str = os.getenv("MOSS_API_KEY", "")
    MOSS_ENDPOINT: str = os.getenv("MOSS_ENDPOINT", "http://localhost:8000/api/moss/local")
    
    # LiveKit credentials
    LIVEKIT_API_KEY: str = os.getenv("LIVEKIT_API_KEY", "devkey")
    LIVEKIT_API_SECRET: str = os.getenv("LIVEKIT_API_SECRET", "secretkey1234567890abcdefghijklmnopqrstuvwxyz")
    LIVEKIT_URL: str = os.getenv("LIVEKIT_URL", "wss://rescuegrid.livekit.cloud")

config = Config()
