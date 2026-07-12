from typing import Optional
from datetime import date
from pydantic import BaseModel
from ..models.user import RoleEnum
from ..models.vehicle import VehicleStatusEnum
from ..models.driver import DriverStatusEnum

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str
    role: RoleEnum

class UserResponse(BaseModel):
    id: int
    email: str
    role: RoleEnum

    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleBase(BaseModel):
    reg_number: str
    model: str
    type: str
    max_load: float
    acquisition_cost: float

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    model: Optional[str] = None
    type: Optional[str] = None
    max_load: Optional[float] = None
    odometer: Optional[float] = None
    status: Optional[VehicleStatusEnum] = None

class VehicleResponse(VehicleBase):
    id: int
    odometer: float
    status: VehicleStatusEnum

    class Config:
        from_attributes = True

# Driver Schemas
class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: Optional[str] = None
    license_expiry: date
    contact: Optional[str] = None

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[DriverStatusEnum] = None

class DriverResponse(DriverBase):
    id: int
    safety_score: float
    status: DriverStatusEnum

    class Config:
        from_attributes = True
