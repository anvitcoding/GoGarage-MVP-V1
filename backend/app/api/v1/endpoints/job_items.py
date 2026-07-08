from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.enums import ItemType, JobStatus, UserRole
from app.models.job_item import JobItem
from app.models.service_job import ServiceJob
from app.models.user import User
from app.schemas.job_item import JobItemCreate, JobItemResponse

router = APIRouter(prefix="/jobs", tags=["job-items"])


def _get_job_or_404(job_id: int, db: Session) -> ServiceJob:
    from app.api.v1.endpoints.jobs import _get_job_or_404 as _fn

    return _fn(job_id, db)


def _can_modify_items(job: ServiceJob, user: User) -> None:
    """Raise 403 if the user cannot add/remove items on this job."""
    is_admin = user.role == UserRole.admin
    is_assigned_tech = (
        user.role == UserRole.technician and job.technician_id == user.id
    )
    if not is_admin and not is_assigned_tech:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if job.status == JobStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify items on a completed job",
        )


@router.post(
    "/{job_id}/items",
    response_model=JobItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_job_item(
    job_id: int,
    payload: JobItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a service or part line item to a job.
    Only the assigned technician (or admin) can add items.
    """
    job = _get_job_or_404(job_id, db)
    _can_modify_items(job, current_user)

    item = JobItem(
        job_id=job.id,
        description=payload.description,
        item_type=payload.item_type,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        added_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{job_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_job_item(
    job_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a line item from a job.  Only while the job is not completed."""
    job = _get_job_or_404(job_id, db)
    _can_modify_items(job, current_user)

    item = (
        db.query(JobItem)
        .filter(JobItem.id == item_id, JobItem.job_id == job_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    db.delete(item)
    db.commit()
    return None  # 204
