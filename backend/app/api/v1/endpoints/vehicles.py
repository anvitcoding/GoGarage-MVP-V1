from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleDetail, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def _get_vehicle_or_404(vehicle_id: int, db: Session) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Customer sees own vehicles; Admin sees all."""
    q = db.query(Vehicle)
    if current_user.role != UserRole.admin:
        q = q.filter(Vehicle.customer_id == current_user.id)
    return q.order_by(Vehicle.id).all()


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a vehicle.  Customer adds for self; Admin can add for any customer."""
    if current_user.role == UserRole.admin:
        if not payload.customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin must provide customer_id",
            )
        customer_id = payload.customer_id
    else:
        customer_id = current_user.id

    # Verify customer exists
    customer = db.query(User).filter(User.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    vehicle = Vehicle(
        customer_id=customer_id,
        reg_number=payload.reg_number,
        make=payload.make,
        model=payload.model,
        year=payload.year,
        fuel_type=payload.fuel_type,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleDetail)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vehicle detail + service history.  Owner or Admin only."""
    vehicle = _get_vehicle_or_404(vehicle_id, db)

    # Authorization: owner or admin
    if current_user.role != UserRole.admin and vehicle.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Build response manually — VehicleDetail.service_jobs uses JobListItem
    # which has computed fields (vehicle_reg_number, customer_name) not
    # directly available via ORM from_attributes on the ServiceJob model.
    from app.api.v1.endpoints.jobs import _job_to_list_item

    vehicle_data = {
        "id": vehicle.id,
        "customer_id": vehicle.customer_id,
        "reg_number": vehicle.reg_number,
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "fuel_type": vehicle.fuel_type,
        "created_at": vehicle.created_at,
        "service_jobs": [
            _job_to_list_item(j) for j in (vehicle.service_jobs or [])
        ],
    }
    return vehicle_data
