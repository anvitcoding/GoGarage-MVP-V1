from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reg_number = Column(String(20), nullable=False)
    make = Column(String(60), nullable=False)
    model = Column(String(60), nullable=False)
    year = Column(Integer, nullable=True)
    fuel_type = Column(String(20), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    customer = relationship("User", back_populates="vehicles", lazy="selectin")
    service_jobs = relationship(
        "ServiceJob", back_populates="vehicle", lazy="selectin"
    )

    def __repr__(self):
        return f"<Vehicle(id={self.id}, reg={self.reg_number})>"
