from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import InvoiceStatus


class InvoiceResponse(BaseModel):
    id: int
    job_id: int
    subtotal: float
    gst_percent: float
    gst_amount: float
    total: float
    status: str
    payment_mode: str | None = None
    created_at: datetime
    paid_at: datetime | None = None

    model_config = {"from_attributes": True}


class InvoiceUpdate(BaseModel):
    status: InvoiceStatus
    payment_mode: str | None = Field(None, max_length=20)
