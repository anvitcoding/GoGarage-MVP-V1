from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.invoices import router as invoices_router
from app.api.v1.endpoints.job_items import router as job_items_router
from app.api.v1.endpoints.jobs import router as jobs_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.vehicles import router as vehicles_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(vehicles_router)
api_router.include_router(jobs_router)
api_router.include_router(job_items_router)
api_router.include_router(invoices_router)


@api_router.get("/health")
def health_check():
    return {"status": "ok", "service": "gogarage-mvp"}
