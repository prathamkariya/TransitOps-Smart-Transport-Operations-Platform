from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class MaintenanceLogBase(BaseModel):
    vehicle_id: int
    type: str = Field(..., min_length=1)
    cost: float = Field(default=0.0, ge=0)


class MaintenanceLogCreate(MaintenanceLogBase):
    pass


class MaintenanceLogResponse(MaintenanceLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    opened_at: datetime
    closed_at: Optional[datetime] = None
