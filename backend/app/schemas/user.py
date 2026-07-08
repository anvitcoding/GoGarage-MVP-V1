from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class UserCreate(BaseModel):
    """Admin creates a technician or admin account."""

    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(None, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole


class UserUpdate(BaseModel):
    """Activate or deactivate a user."""

    is_active: bool


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
