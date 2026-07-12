import enum
<<<<<<< HEAD
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String
from sqlalchemy.sql import func

from ..core.db import Base


class RoleEnum(str, enum.Enum):
=======
from sqlalchemy import Column, Integer, String, Enum as SAEnum, DateTime
from sqlalchemy.sql import func
from app.database import Base


class UserRole(str, enum.Enum):
>>>>>>> origin/main
    fleet_manager = "fleet_manager"
    driver = "driver"
    safety_officer = "safety_officer"
    financial_analyst = "financial_analyst"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
<<<<<<< HEAD
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
=======
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(UserRole, name="userrole", create_type=False), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
>>>>>>> origin/main
