
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.db import Base, get_db as core_get_db
from app.database import get_db as auth_get_db
from app.models.user import User, UserRole
from app.auth import hash_password

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Override both FastAPI dependencies (Eng 01's and Eng 03's)
app.dependency_overrides[core_get_db] = override_get_db
app.dependency_overrides[auth_get_db] = override_get_db

@pytest.fixture(scope="module")
def db_session():
    # Create the database schema
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed a test user (Fleet Manager)
    fleet_manager = User(
        email="fleet@test.com",
        password_hash=hash_password("testpass"),
        role=UserRole.fleet_manager,
        is_active=True,
    )
    # Seed a test user (Driver)
    driver_user = User(
        email="driver@test.com",
        password_hash=hash_password("testpass"),
        role=UserRole.driver,
        is_active=True,
    )
    
    db.add(fleet_manager)
    db.add(driver_user)
    db.commit()
    
    yield db
    
    # Drop the schema after tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module", autouse=True)
def mock_setup_database():
    with patch("app.main.setup_database"):
        yield

@pytest.fixture(scope="module")
def client(db_session):
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def fleet_token(client):
    response = client.post("/api/v1/auth/login", data={"username": "fleet@test.com", "password": "testpass"})
    return response.json()["access_token"]

@pytest.fixture(scope="module")
def driver_token(client):
    response = client.post("/api/v1/auth/login", data={"username": "driver@test.com", "password": "testpass"})
    return response.json()["access_token"]
