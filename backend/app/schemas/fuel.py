from pydantic import BaseModel, field_validator
from pydantic import ConfigDict
from datetime import date, datetime
from typing import Optional


class FuelLogCreate(BaseModel):
    vehicle_id: int
    liters: float
    cost_per_liter: float
    odometer_reading: Optional[float] = None
    date: date
    notes: Optional[str] = None

    @field_validator("liters")
    @classmethod
    def liters_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Liters must be positive")
        return v

    @field_validator("cost_per_liter")
    @classmethod
    def cost_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Cost per liter must be positive")
        return v


class FuelLogUpdate(BaseModel):
    liters: Optional[float] = None
    cost_per_liter: Optional[float] = None
    odometer_reading: Optional[float] = None
    date: Optional[date] = None
    notes: Optional[str] = None


class FuelLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    liters: float
    cost_per_liter: float
    total_cost: float
    odometer_reading: Optional[float]
    date: date
    notes: Optional[str]
    created_at: datetime
