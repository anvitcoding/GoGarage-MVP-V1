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
from app.models.enums import ItemType


class JobItem(Base):
    __tablename__ = "job_items"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("service_jobs.id"), nullable=False)
    description = Column(String(200), nullable=False)
    item_type = Column(Enum(ItemType, name="itemtype"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    job = relationship("ServiceJob", back_populates="job_items", lazy="selectin")
    added_by_technician = relationship(
        "User", back_populates="job_items", lazy="selectin"
    )

    def __repr__(self):
        return f"<JobItem(id={self.id}, type={self.item_type}, desc={self.description})>"
