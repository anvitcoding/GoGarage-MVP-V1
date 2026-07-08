from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.enums import JobStatus, UserRole
from app.models.service_job import ServiceJob
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.job import JobCreate, JobListItem, JobResponse, JobUpdate
from app.services.jobs import transition_job_status

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _get_job_or_404(job_id: int, db: Session) -> ServiceJob:
    job = db.query(ServiceJob).filter(ServiceJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job


def _job_to_list_item(job: ServiceJob) -> dict:
    """Build a flat JobListItem dict from a ServiceJob ORM instance."""
    return {
        "id": job.id,
        "vehicle_id": job.vehicle_id,
        "vehicle_reg_number": job.vehicle.reg_number if job.vehicle else None,
        "customer_id": job.customer_id,
        "customer_name": job.customer.name if job.customer else None,
        "technician_id": job.technician_id,
        "technician_name": job.technician.name if job.technician else None,
        "status": job.status.value,
        "description": job.description,
        "km_reading": job.km_reading,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "completed_at": job.completed_at,
    }


def _job_to_response(job: ServiceJob) -> dict:
    """Build a full JobResponse dict with nested items, invoice, and vehicle."""
    from app.schemas.invoice import InvoiceResponse
    from app.schemas.job_item import JobItemResponse
    from app.schemas.vehicle import VehicleBrief

    return {
        "id": job.id,
        "vehicle_id": job.vehicle_id,
        "customer_id": job.customer_id,
        "technician_id": job.technician_id,
        "status": job.status.value,
        "description": job.description,
        "km_reading": job.km_reading,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "completed_at": job.completed_at,
        "vehicle": VehicleBrief.model_validate(job.vehicle) if job.vehicle else None,
        "customer_name": job.customer.name if job.customer else None,
        "technician_name": job.technician.name if job.technician else None,
        "items": [JobItemResponse.model_validate(i) for i in job.job_items]
        if job.job_items else [],
        "invoice": InvoiceResponse.model_validate(job.invoice) if job.invoice else None,
    }


# ── GET /jobs ──────────────────────────────────────────────────────

@router.get("", response_model=list[JobListItem])
def list_jobs(
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Role-scoped job list.

    - Customer: own jobs only.
    - Technician: assigned jobs only.
    - Admin: all jobs, optionally filtered by ?status=.
    """
    q = db.query(ServiceJob)

    if current_user.role == UserRole.customer:
        q = q.filter(ServiceJob.customer_id == current_user.id)
    elif current_user.role == UserRole.technician:
        q = q.filter(ServiceJob.technician_id == current_user.id)
    # admin sees all

    if status_filter:
        try:
            js = JobStatus(status_filter)
            q = q.filter(ServiceJob.status == js)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}",
            )

    jobs = q.order_by(ServiceJob.updated_at.desc()).all()
    return [_job_to_list_item(j) for j in jobs]


# ── POST /jobs ─────────────────────────────────────────────────────

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a service job card.  Customer or Admin."""
    # Validate vehicle
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    # Customer can only create jobs for own vehicles
    if current_user.role == UserRole.customer and vehicle.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    job = ServiceJob(
        vehicle_id=payload.vehicle_id,
        customer_id=vehicle.customer_id,
        description=payload.description,
        km_reading=payload.km_reading,
        status=JobStatus.created,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_to_response(job)


# ── GET /jobs/{id} ─────────────────────────────────────────────────

@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Job detail including items + invoice.
    Accessible by: owner customer, assigned technician, or admin.
    """
    job = _get_job_or_404(job_id, db)

    if current_user.role == UserRole.customer and job.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.technician and job.technician_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _job_to_response(job)


# ── PATCH /jobs/{id} ───────────────────────────────────────────────

@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    payload: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a job.

    - Admin: can assign technician and/or change status.
    - Technician: can change status of own jobs only.
    """
    job = _get_job_or_404(job_id, db)

    is_admin = current_user.role == UserRole.admin
    is_assigned_tech = (
        current_user.role == UserRole.technician
        and job.technician_id == current_user.id
    )

    if not is_admin and not is_assigned_tech:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Technician can only update status (not reassign)
    if is_assigned_tech:
        if payload.technician_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin can reassign a job",
            )
        if payload.status is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
        transition_job_status(job, payload.status, db)
        job.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(job)
        return _job_to_response(job)

    # Admin: can assign technician and/or change status
    if payload.technician_id is not None:
        tech = db.query(User).filter(
            User.id == payload.technician_id, User.role == UserRole.technician
        ).first()
        if not tech:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Technician not found",
            )
        job.technician_id = payload.technician_id

    if payload.status is not None:
        transition_job_status(job, payload.status, db)

    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)
    return _job_to_response(job)
