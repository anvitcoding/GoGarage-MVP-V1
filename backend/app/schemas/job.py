from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import JobStatus


class JobCreate(BaseModel):
    vehicle_id: int
    description: str = Field(..., min_length=1)
    km_reading: int | None = None


class JobUpdate(BaseModel):
    technician_id: int | None = None
    status: JobStatus | None = None


class JobListItem(BaseModel):
    id: int
    vehicle_id: int
    vehicle_reg_number: str
    customer_id: int
    customer_name: str
    technician_id: int | None = None
    technician_name: str | None = None
    status: str
    description: str
    km_reading: int | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class JobResponse(BaseModel):
    """Full job detail — returned by GET /jobs/{id}."""

    id: int
    vehicle_id: int
    customer_id: int
    technician_id: int | None = None
    status: str
    description: str
    km_reading: int | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None

    # Nested
    vehicle: "VehicleBrief | None" = None
    customer_name: str | None = None
    technician_name: str | None = None
    items: list["JobItemResponse"] = []
    invoice: "InvoiceResponse | None" = None

    model_config = {"from_attributes": True}


# Late imports for forward references
from app.schemas.invoice import InvoiceResponse  # noqa: E402
from app.schemas.job_item import JobItemResponse  # noqa: E402
from app.schemas.vehicle import VehicleBrief  # noqa: E402

JobResponse.model_rebuild()
