"""
expenses.py — Expense CRUD endpoints (Engineer 03 scope).
Tracks tolls, repairs, and miscellaneous costs per vehicle (and optionally per trip).
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.expense import Expense, ExpenseType
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])


# ─── Create ──────────────────────────────────────────────────────────────────

@router.post("/", response_model=ExpenseResponse, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if payload.trip_id:
        trip = db.query(Trip).filter(Trip.id == payload.trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        if trip.vehicle_id != payload.vehicle_id:
            raise HTTPException(status_code=400, detail="Trip does not belong to this vehicle")

    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


# ─── List ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ExpenseResponse])
def list_expenses(
    vehicle_id: Optional[int] = Query(None),
    trip_id: Optional[int] = Query(None),
    type: Optional[ExpenseType] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Expense)
    if vehicle_id:
        q = q.filter(Expense.vehicle_id == vehicle_id)
    if trip_id:
        q = q.filter(Expense.trip_id == trip_id)
    if type:
        q = q.filter(Expense.type == type)
    if date_from:
        q = q.filter(Expense.date >= date_from)
    if date_to:
        q = q.filter(Expense.date <= date_to)
    return q.order_by(Expense.date.desc()).offset(skip).limit(limit).all()


# ─── Get one ─────────────────────────────────────────────────────────────────

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


# ─── Update ──────────────────────────────────────────────────────────────────

@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense


# ─── Delete ──────────────────────────────────────────────────────────────────

@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
