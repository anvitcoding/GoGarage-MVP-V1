"""Business logic for service-job status transitions."""

from fastapi import HTTPException, status

from app.models.enums import JobStatus
from app.models.service_job import ServiceJob
from app.services.invoice import generate_invoice


VALID_TRANSITIONS = {
    JobStatus.created: {JobStatus.in_progress},
    JobStatus.in_progress: {JobStatus.completed},
    JobStatus.completed: set(),  # terminal state
}


def transition_job_status(job: ServiceJob, new_status: JobStatus, db) -> None:
    """Validate the transition, update the job, and trigger side-effects.

    - created → in_progress: allowed
    - in_progress → completed: allowed (triggers invoice generation)
    - completed → anything: forbidden
    """
    current = job.status

    if new_status not in VALID_TRANSITIONS.get(current, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{current.value}' to '{new_status.value}'",
        )

    job.status = new_status

    if new_status == JobStatus.completed:
        generate_invoice(job, db)
