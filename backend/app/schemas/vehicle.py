from datetime import datetime

from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    reg_number: str = Field(..., min_length=1, max_length=20)
    make: str = Field(..., min_length=1, max_length=60)
    model: str = Field(..., min_length=1, max_length=60)
    year: int | None = None
    fuel_type: str | None = Field(None, max_length=20)
    customer_id: int | None = None  # admin can specify; otherwise defaults to self


class VehicleResponse(BaseModel):
    id: int
    customer_id: int
    reg_number: str
    make: str
    model: str
    year: int | None = None
    fuel_type: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VehicleBrief(BaseModel):
    """Compact vehicle info for nesting inside job responses."""

    id: int
    reg_number: str
    make: str
    model: str

    model_config = {"from_attributes": True}


class VehicleDetail(VehicleResponse):
    """Vehicle detail with service history."""

    service_jobs: list["JobListItem"] = []

    model_config = {"from_attributes": True}


# Late import for forward reference
from app.schemas.job import JobListItem  # noqa: E402

VehicleDetail.model_rebuild()
