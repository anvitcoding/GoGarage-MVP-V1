from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="userrole"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    vehicles = relationship("Vehicle", back_populates="customer", lazy="selectin")
    customer_jobs = relationship(
        "ServiceJob",
        foreign_keys="ServiceJob.customer_id",
        back_populates="customer",
        lazy="selectin",
    )
    technician_jobs = relationship(
        "ServiceJob",
        foreign_keys="ServiceJob.technician_id",
        back_populates="technician",
        lazy="selectin",
    )
    job_items = relationship(
        "JobItem", back_populates="added_by_technician", lazy="selectin"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
