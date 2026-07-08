from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.enums import InvoiceStatus, UserRole
from app.models.invoice import Invoice
from app.models.service_job import ServiceJob
from app.models.user import User
from app.schemas.invoice import InvoiceResponse, InvoiceUpdate

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _get_invoice_or_404(invoice_id: int, db: Session) -> Invoice:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List invoices.
    - Admin: all invoices.
    - Customer: only invoices for own jobs.
    """
    q = db.query(Invoice).join(ServiceJob)

    if current_user.role == UserRole.customer:
        q = q.filter(ServiceJob.customer_id == current_user.id)
    elif current_user.role == UserRole.technician:
        # Technicians don't have an invoice list view per the plan,
        # but return empty rather than erroring.
        return []

    return q.order_by(Invoice.id).all()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invoice detail.  Accessible by the job owner or admin."""
    invoice = _get_invoice_or_404(invoice_id, db)

    if current_user.role == UserRole.admin:
        return invoice

    # Customer: only own
    if current_user.role == UserRole.customer:
        if invoice.job and invoice.job.customer_id == current_user.id:
            return invoice
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Technician: no invoice access
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Mark an invoice as paid.  Admin only."""
    invoice = _get_invoice_or_404(invoice_id, db)

    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already paid",
        )

    invoice.status = payload.status
    invoice.payment_mode = payload.payment_mode
    if payload.status == InvoiceStatus.paid:
        invoice.paid_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(invoice)
    return invoice
