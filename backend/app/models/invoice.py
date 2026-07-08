from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.enums import InvoiceStatus


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(
        Integer, ForeignKey("service_jobs.id"), unique=True, nullable=False
    )
    subtotal = Column(Numeric(10, 2), nullable=False)
    gst_percent = Column(Numeric(4, 2), default=18.00, nullable=False)
    gst_amount = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    status = Column(
        Enum(InvoiceStatus, name="invoicestatus"),
        default=InvoiceStatus.unpaid,
        nullable=False,
    )
    payment_mode = Column(String(20), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    job = relationship("ServiceJob", back_populates="invoice", lazy="selectin")

    def __repr__(self):
        return f"<Invoice(id={self.id}, job_id={self.job_id}, status={self.status})>"
