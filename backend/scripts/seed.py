import os
import sys

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import SessionLocal
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

def seed_db():
    print("Starting database seed...")
    db = SessionLocal()
    
    # Check if we already have users
    if db.query(User).first():
        print("Database already seeded with users. Skipping.")
        db.close()
        return

    # Seed Fleet Manager
    fleet_manager = User(
        email="fleet@transitops.com",
        password_hash=get_password_hash("password123"),
        role=RoleEnum.fleet_manager,
        is_active=True,
    )
    
    # Seed Driver
    driver = User(
        email="driver@transitops.com",
        password_hash=get_password_hash("password123"),
        role=RoleEnum.driver,
        is_active=True,
    )
    
    db.add(fleet_manager)
    db.add(driver)
    
    db.commit()
    print("Seeded 1 Fleet Manager (fleet@transitops.com / password123)")
    print("Seeded 1 Driver (driver@transitops.com / password123)")
    print("Database seeding completed.")
    db.close()

if __name__ == "__main__":
    seed_db()
