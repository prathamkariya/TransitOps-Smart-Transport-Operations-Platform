"""
Seed script — creates one demo user per role for hackathon demos.

Run once after `alembic upgrade head`:
    python seed.py

Demo credentials (all share the same password):
    fleet.manager@demo.com  / Demo@1234  (fleet_manager)
    driver@demo.com         / Demo@1234  (driver)
    safety.officer@demo.com / Demo@1234  (safety_officer)
    analyst@demo.com        / Demo@1234  (financial_analyst)
"""
import sys
import os

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(__file__))

from app.core.db import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum

DEMO_PASSWORD = "Demo@1234"

DEMO_USERS = [
    {"email": "fleet.manager@demo.com", "role": RoleEnum.fleet_manager},
    {"email": "driver@demo.com",         "role": RoleEnum.driver},
    {"email": "safety.officer@demo.com", "role": RoleEnum.safety_officer},
    {"email": "analyst@demo.com",        "role": RoleEnum.financial_analyst},
]


def seed():
    db = SessionLocal()
    try:
        created = 0
        skipped = 0
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                print(f"  SKIP (already exists): {u['email']}")
                skipped += 1
                continue
            user = User(
                email=u["email"],
                password_hash=get_password_hash(DEMO_PASSWORD),
                role=u["role"],
                is_active=True,
            )
            db.add(user)
            created += 1
            print(f"  CREATED: {u['email']}  role={u['role'].value}")

        db.commit()
        print(f"\nDone. Created: {created}  Skipped: {skipped}")
        print("Password for all demo users: Demo@1234")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding demo users...")
    seed()
