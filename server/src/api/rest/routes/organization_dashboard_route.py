"""Organization dashboard and lookup routes.

Exposes dashboard summary data and a lightweight organization name
lookup endpoint used by frontend lookups.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPBearer

from src.api.rest.dependencies import (
    get_authenticated_user_context,
    get_organization_billing_service,
)
from src.core.services.organization_billing_service import OrganizationBillingService
from src.schemas.auth_schema import AuthenticatedUserContext
from src.schemas.dashboard_schema import DashboardSummaryResponse
from src.schemas.organization_schema import OrganizationNameResponse

router = APIRouter(prefix="/organization/dashboard", tags=["Organization Dashboard"])
lookup_router = APIRouter(prefix="/organizations", tags=["Organizations"])
security = HTTPBearer()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    recent_limit: int = Query(default=5, ge=1, le=50),
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.get_dashboard_summary(auth_context, recent_limit)


@lookup_router.get("/{organization_id}/name", response_model=OrganizationNameResponse)
async def get_organization_name(
    organization_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    organization = await billing_service.get_organization_name(organization_id, auth_context)

    return OrganizationNameResponse.model_validate(organization)
