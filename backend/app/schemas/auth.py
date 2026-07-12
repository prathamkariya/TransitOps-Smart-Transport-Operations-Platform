from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole

# Roles that can self-register. fleet_manager and safety_officer
# must be created by an existing fleet manager (no self-assigned privilege).
SELF_REGISTER_ROLES = {UserRole.dispatcher, UserRole.financial_analyst}


class UserCreate(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    password: str
    role: UserRole


class UserAdminCreate(BaseModel):
    """Only fleet_manager can use this — creates privileged accounts."""
    name: Optional[str] = None
    email: EmailStr
    password: str
    role: UserRole  # any role, no restriction


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: Optional[str]
    email: str
    role: UserRole
    is_active: bool

