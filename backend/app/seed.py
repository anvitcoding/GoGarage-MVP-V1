"""Seed script — creates demo accounts for the MVP.

Run via:  docker compose exec backend python -m app.seed

Creates (if they don't already exist):
  - 1 admin:       admin@garage.com   / admin123
  - 1 technician:  tech@garage.com    / tech123
  - 1 customer:    customer@garage.com / customer123
      - 1 vehicle: MH12AB1234, Maruti Swift, 2020, petrol

The script is idempotent — safe to run multiple times.
"""

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import UserRole
from app.models.user import User
from app.models.vehicle import Vehicle

SEED_USERS = [
    {
        "name": "Garage Admin",
        "email": "admin@garage.com",
        "password": "admin123",
        "role": UserRole.admin,
    },
    {
        "name": "Garage Technician",
        "email": "tech@garage.com",
        "password": "tech123",
        "role": UserRole.technician,
    },
    {
        "name": "Demo Customer",
        "email": "customer@garage.com",
        "password": "customer123",
        "role": UserRole.customer,
    },
]

SEED_VEHICLE = {
    "reg_number": "MH12AB1234",
    "make": "Maruti",
    "model": "Swift",
    "year": 2020,
    "fuel_type": "petrol",
}


def seed():
    db = SessionLocal()

    try:
        created_users = {}
        for entry in SEED_USERS:
            existing = db.query(User).filter(User.email == entry["email"]).first()
            if existing:
                print(f"  SKIP {entry['email']} — already exists (id={existing.id})")
                created_users[entry["role"]] = existing
                continue

            user = User(
                name=entry["name"],
                email=entry["email"],
                password_hash=hash_password(entry["password"]),
                role=entry["role"],
            )
            db.add(user)
            db.flush()  # get the id without committing each row
            created_users[entry["role"]] = user
            print(f"  CREATE {entry['email']} (role={entry['role'].value}, id={user.id})")

        db.commit()

        # ── Vehicle for the demo customer ──────────────────────────
        customer = created_users.get(UserRole.customer)
        if customer is None:
            print("  WARN: no customer user found — skipping vehicle creation")
            return

        existing_vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.customer_id == customer.id,
                Vehicle.reg_number == SEED_VEHICLE["reg_number"],
            )
            .first()
        )
        if existing_vehicle:
            print(f"  SKIP vehicle {SEED_VEHICLE['reg_number']} — already exists (id={existing_vehicle.id})")
        else:
            vehicle = Vehicle(customer_id=customer.id, **SEED_VEHICLE)
            db.add(vehicle)
            db.commit()
            print(f"  CREATE vehicle {SEED_VEHICLE['reg_number']} for customer (id={vehicle.id})")

        print("\nSeed complete. Demo logins:")
        print("  Admin:      admin@garage.com    / admin123")
        print("  Technician: tech@garage.com     / tech123")
        print("  Customer:   customer@garage.com / customer123")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed()
