from pydantic import BaseModel
from typing import List, Optional


class FuelEfficiencyRow(BaseModel):
    vehicle_id: int
    reg_number: str
    model: str
    type: str
    total_distance_km: float
    total_fuel_liters: float
    fuel_efficiency_km_per_liter: float
    total_fuel_cost: float


class OperationalCostRow(BaseModel):
    vehicle_id: int
    reg_number: str
    model: str
    type: str
    status: str
    total_fuel_cost: float
    total_maintenance_cost: float
    total_expense_cost: float
    total_operational_cost: float


class VehicleROIRow(BaseModel):
    vehicle_id: int
    reg_number: str
    model: str
    acquisition_cost: float
    total_revenue: float
    total_operational_cost: float
    net_profit: float
    roi_percentage: float


class FleetUtilizationRow(BaseModel):
    vehicle_id: int
    reg_number: str
    model: str
    type: str
    current_status: str
    total_trips: int
    completed_trips: int
    active_trips: int
