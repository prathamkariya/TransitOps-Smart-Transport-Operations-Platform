
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.db import Base, get_db
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

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

# Override the FastAPI dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def db_session():
    # Create the database schema
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed a test user (Fleet Manager)
    fleet_manager = User(
        email="fleet@test.com",
        password_hash=get_password_hash("testpass"),
        role=RoleEnum.fleet_manager,
        is_active=True,
    )
    # Seed a test user (Driver)
    driver_user = User(
        email="driver@test.com",
        password_hash=get_password_hash("testpass"),
        role=RoleEnum.driver,
        is_active=True,
    )
    
    db.add(fleet_manager)
    db.add(driver_user)
    db.commit()
    
    yield db
    
    # Drop the schema after tests
    Base.metadata.drop_all(bind=engine)

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
