import uuid
import datetime
import logging
from typing import Optional, Dict, Any, List
import jwt
import bcrypt
from fastapi import APIRouter, HTTPException, Header, Depends, status
from backend.config import config
from backend.models.schemas import (
    UserAccount, AuthUser, LoginRequest, RegisterRequest, AuthResponse, AuditLog
)
from backend.services.db_service import db_service
from backend.services.audit_service import audit_service

logger = logging.getLogger("rescuegrid.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_USERS: List[Dict[str, Any]] = [
    {
        "userId": "usr-commander-01",
        "name": "Chief Sarah Jenkins",
        "email": "commander@rescuegrid.ai",
        "password": "Commander2026!",
        "role": "COMMANDER_OPERATOR",
        "department": "Incident Command Post (Sector Alpha)",
        "badgeNumber": "CMD-9001"
    },
    {
        "userId": "usr-dispatcher-02",
        "name": "Marcus Vance",
        "email": "dispatcher@rescuegrid.ai",
        "password": "Dispatch2026!",
        "role": "DISPATCHER",
        "department": "Regional 911 Emergency Communications",
        "badgeNumber": "DSP-4420"
    },
    {
        "userId": "usr-fieldlead-03",
        "name": "Capt. Elena Rostova",
        "email": "fieldlead@rescuegrid.ai",
        "password": "Rescue2026!",
        "role": "FIELD_LEAD",
        "department": "Heavy Extrication & HazMat Taskforce",
        "badgeNumber": "FLD-7782"
    },
    {
        "userId": "usr-medical-04",
        "name": "Dr. Aris Thorne",
        "email": "medical@rescuegrid.ai",
        "password": "Medical2026!",
        "role": "COMMANDER_OPERATOR",
        "department": "Trauma & Emergency Medical Services",
        "badgeNumber": "MED-1109"
    }
]

def generate_token(user: AuthUser) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "userId": user.userId,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "badgeNumber": user.badgeNumber,
        "iat": now,
        "exp": now + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")

async def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[AuthUser]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        return AuthUser(
            userId=payload["userId"],
            name=payload["name"],
            email=payload["email"],
            role=payload.get("role", "COMMANDER_OPERATOR"),
            department=payload.get("department", "Emergency Response"),
            badgeNumber=payload.get("badgeNumber", "RG-9001")
        )
    except Exception as e:
        logger.debug(f"JWT decode error: {e}")
        return None

@router.get("/seed-users")
async def get_seed_users():
    """Return operational accounts for convenient 1-click persona switching."""
    return {
        "success": True,
        "users": DEMO_USERS
    }

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    """Authenticate operational personnel via email and password."""
    if not payload.email or not payload.password:
        return AuthResponse(success=False, error="Email and password are required.")

    clean_email = payload.email.strip().lower()
    user = await db_service.get_user_by_email(clean_email)

    if not user:
        # Check if matches any demo user
        demo_match = next((u for u in DEMO_USERS if u["email"].lower() == clean_email), None)
        if demo_match and demo_match["password"] == payload.password:
            # Seed and authenticate demo user
            salt = bcrypt.gensalt()
            pwd_hash = bcrypt.hashpw(demo_match["password"].encode('utf-8'), salt).decode('utf-8')
            user = UserAccount(
                userId=demo_match["userId"],
                name=demo_match["name"],
                email=demo_match["email"],
                passwordHash=pwd_hash,
                role=demo_match["role"],
                department=demo_match["department"],
                badgeNumber=demo_match["badgeNumber"]
            )
            await db_service.save_user(user)
        else:
            return AuthResponse(success=False, error="Invalid credentials. Personnel account not found.")

    # Verify password hash
    try:
        is_valid = bcrypt.checkpw(payload.password.encode('utf-8'), user.passwordHash.encode('utf-8'))
    except Exception:
        # Fallback check
        is_valid = (user.passwordHash == payload.password)

    if not is_valid:
        return AuthResponse(success=False, error="Invalid credentials. Password does not match.")

    auth_user = AuthUser(
        userId=user.userId,
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department,
        badgeNumber=user.badgeNumber
    )

    token = generate_token(auth_user)

    await audit_service.log_action(
        incident_id="SYSTEM",
        actor=auth_user.name,
        action="USER_LOGIN",
        summary=f"Personnel authenticated via JWT: {auth_user.name} ({auth_user.role})"
    )

    return AuthResponse(
        success=True,
        message="Authentication successful.",
        token=token,
        user=auth_user
    )

@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    """Register new emergency operations responder."""
    if not payload.name or not payload.email or not payload.password:
        return AuthResponse(success=False, error="Name, email, and password are required.")

    clean_email = payload.email.strip().lower()
    existing = await db_service.get_user_by_email(clean_email)
    if existing:
        return AuthResponse(success=False, error="An account with this email already exists.")

    salt = bcrypt.gensalt()
    pwd_hash = bcrypt.hashpw(payload.password.encode('utf-8'), salt).decode('utf-8')
    user_id = f"usr-{int(datetime.datetime.utcnow().timestamp())}-{uuid.uuid4().hex[:4]}"

    new_user = UserAccount(
        userId=user_id,
        name=payload.name.strip(),
        email=clean_email,
        passwordHash=pwd_hash,
        role=payload.role or "COMMANDER_OPERATOR",
        department=payload.department or "Emergency Operations Command",
        badgeNumber=payload.badgeNumber or f"RG-{uuid.uuid4().hex[:4].upper()}"
    )

    await db_service.save_user(new_user)

    auth_user = AuthUser(
        userId=new_user.userId,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        badgeNumber=new_user.badgeNumber
    )

    token = generate_token(auth_user)

    await audit_service.log_action(
        incident_id="SYSTEM",
        actor=auth_user.name,
        action="USER_REGISTER",
        summary=f"New personnel registered: {auth_user.name} ({auth_user.role})"
    )

    return AuthResponse(
        success=True,
        message="Personnel registered successfully.",
        token=token,
        user=auth_user
    )

@router.get("/me")
async def get_current_user_profile(user: Optional[AuthUser] = Depends(get_current_user)):
    """Get active authenticated session profile."""
    if not user:
        return {"success": False, "error": "Unauthorized or expired session."}
    return {
        "success": True,
        "user": user.model_dump()
    }

@router.post("/logout")
async def logout(user: Optional[AuthUser] = Depends(get_current_user)):
    """Close personnel session."""
    if user:
        await audit_service.log_action(
            incident_id="SYSTEM",
            actor=user.name,
            action="USER_LOGOUT",
            summary=f"Personnel session closed: {user.name}"
        )
    return {
        "success": True,
        "message": "Logged out successfully."
    }
