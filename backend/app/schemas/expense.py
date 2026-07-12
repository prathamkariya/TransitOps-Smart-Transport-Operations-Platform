from pydantic import BaseModel, field_validator
from pydantic import ConfigDict
from datetime import date, datetime
from typing import Optional
from app.models.expense import ExpenseType


class ExpenseCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    type: ExpenseType
    amount: float
    date: date
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class ExpenseUpdate(BaseModel):
    type: Optional[ExpenseType] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    trip_id: Optional[int]
    type: ExpenseType
    amount: float
    date: date
    notes: Optional[str]
    created_at: datetime
