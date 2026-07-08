"""Invoice generation — called automatically when a job is completed."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.enums import InvoiceStatus
from app.models.invoice import Invoice
from app.models.job_item import JobItem
from app.models.service_job import ServiceJob

GST_PERCENT = Decimal("18.00")


def generate_invoice(job: ServiceJob, db: Session) -> Invoice:
    """Sum all job_items on *job*, create an Invoice row, and return it.

    Should only be called once per job (when status transitions to completed).
    """
    items = db.query(JobItem).filter(JobItem.job_id == job.id).all()

    subtotal = sum(
        (item.unit_price or Decimal("0")) * (item.quantity or 0) for item in items
    )
    gst_amount = subtotal * GST_PERCENT / Decimal("100")
    total = subtotal + gst_amount

    invoice = Invoice(
        job_id=job.id,
        subtotal=subtotal,
        gst_percent=GST_PERCENT,
        gst_amount=gst_amount,
        total=total,
        status=InvoiceStatus.unpaid,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice
