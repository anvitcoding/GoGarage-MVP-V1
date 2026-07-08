import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    technician = "technician"
    customer = "customer"


class JobStatus(str, enum.Enum):
    created = "created"
    in_progress = "in_progress"
    completed = "completed"


class ItemType(str, enum.Enum):
    service = "service"
    part = "part"


class InvoiceStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"
