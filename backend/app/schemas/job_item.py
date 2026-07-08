from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ItemType


class JobItemCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=200)
    item_type: ItemType
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., gt=0)


class JobItemResponse(BaseModel):
    id: int
    job_id: int
    description: str
    item_type: str
    quantity: int
    unit_price: float
    added_by: int
    created_at: datetime

    model_config = {"from_attributes": True}
