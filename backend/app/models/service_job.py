from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.enums import JobStatus


class ServiceJob(Base):
    __tablename__ = "service_jobs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(
        Enum(JobStatus, name="jobstatus"),
        nullable=False,
        default=JobStatus.created,
    )
    description = Column(Text, nullable=False)
    km_reading = Column(Integer, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="service_jobs", lazy="selectin")
    customer = relationship(
        "User", foreign_keys=[customer_id], back_populates="customer_jobs", lazy="selectin"
    )
    technician = relationship(
        "User",
        foreign_keys=[technician_id],
        back_populates="technician_jobs",
        lazy="selectin",
    )
    job_items = relationship("JobItem", back_populates="job", lazy="selectin")
    invoice = relationship(
        "Invoice", back_populates="job", uselist=False, lazy="selectin"
    )

    def __repr__(self):
        return f"<ServiceJob(id={self.id}, status={self.status})>"
