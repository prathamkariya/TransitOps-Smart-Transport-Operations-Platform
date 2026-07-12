from datetime import date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from ..models.user import RoleEnum
from ..models.vehicle import VehicleStatusEnum
from ..models.driver import DriverStatusEnum

# ── Auth ───────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: RoleEnum
    is_active: bool

    model_config = {"from_attributes": True}


# ── Vehicle ────────────────────────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    reg_number: str = Field(..., min_length=1, description="Vehicle registration number")
    model_name: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    max_load_capacity: float = Field(..., gt=0, description="Must be a positive number")
    acquisition_cost: float = Field(..., gt=0, description="Must be a positive number")
    region: str = Field(..., min_length=1)

    @field_validator("reg_number")
    @classmethod
    def reg_number_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("reg_number cannot be blank")
        return v.strip().upper()


class VehicleUpdate(BaseModel):
    model_name: Optional[str] = None
    type: Optional[str] = None
    max_load_capacity: Optional[float] = Field(default=None, gt=0)
    odometer: Optional[float] = Field(default=None, ge=0)
    region: Optional[str] = None


class VehicleStatusUpdate(BaseModel):
    status: VehicleStatusEnum


class VehicleResponse(BaseModel):
    id: int
    reg_number: str
    model_name: str
    type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    region: str
    status: VehicleStatusEnum

    model_config = {"from_attributes": True}


# ── Driver ─────────────────────────────────────────────────────────────────────

class DriverCreate(BaseModel):
    name: str = Field(..., min_length=1)
    license_number: str = Field(..., min_length=1)
    license_category: Optional[str] = None
    license_expiry: date
    contact_number: Optional[str] = None
    safety_score: float = Field(default=100.0, ge=0, le=100)

    @field_validator("contact_number")
    @classmethod
    def contact_number_basic_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        digits = "".join(filter(str.isdigit, v))
        if len(digits) < 7 or len(digits) > 15:
            raise ValueError("contact_number must contain 7–15 digits")
        return v


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = Field(default=None, ge=0, le=100)


class DriverStatusUpdate(BaseModel):
    status: DriverStatusEnum


class DriverResponse(BaseModel):
    id: int
    name: str
    license_number: str
    license_category: Optional[str]
    license_expiry: date
    contact_number: Optional[str]
    safety_score: float
    status: DriverStatusEnum
    # Computed fields — derived fresh, not stored in DB
    is_license_valid: bool
    days_until_expiry: int

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_computed(cls, driver) -> "DriverResponse":
        """Build response and compute license validity fields."""
        today = date.today()
        days = (driver.license_expiry - today).days
        return cls(
            id=driver.id,
            name=driver.name,
            license_number=driver.license_number,
            license_category=driver.license_category,
            license_expiry=driver.license_expiry,
            contact_number=driver.contact_number,
            safety_score=driver.safety_score,
            status=driver.status,
            is_license_valid=driver.license_expiry >= today,
            days_until_expiry=days,
        )
