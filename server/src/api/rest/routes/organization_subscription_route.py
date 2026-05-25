"""Routes for organization subscription management.

Defines REST endpoints for listing, retrieving and purchasing
subscriptions for organizations and customers.
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
from src.schemas.subscription_schema import (
    CustomerSubscriptionPurchaseRequest,
    CustomerSubscriptionPurchaseResponse,
    OrganizationSubscriptionResponse,
)

router = APIRouter(prefix="/organization/subscriptions", tags=["Organization Subscriptions"])
customer_router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])
security = HTTPBearer()


@router.get("", response_model=list[OrganizationSubscriptionResponse])
async def get_organization_subscriptions(
    status: str | None = None,
    plan_id: UUID | None = None,
    customer_id: UUID | None = None,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.list_subscriptions(
        auth_context=auth_context,
        status=status,
        plan_id=plan_id,
        customer_id=customer_id
    )


@router.get("/active", response_model=list[OrganizationSubscriptionResponse])
async def get_active_subscriptions(
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.list_active_subscriptions(auth_context)


@router.get("/cancelled", response_model=list[OrganizationSubscriptionResponse])
async def get_cancelled_subscriptions(
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.list_cancelled_subscriptions(auth_context)


@router.get("/expiring", response_model=list[OrganizationSubscriptionResponse])
async def get_expiring_subscriptions(
    days: int = Query(default=7, ge=1, le=365),
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.list_expiring_subscriptions(auth_context, days)


@router.get("/{subscription_id}", response_model=OrganizationSubscriptionResponse)
async def get_subscription(
    subscription_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.get_subscription(subscription_id, auth_context)


@customer_router.post("/purchase", response_model=CustomerSubscriptionPurchaseResponse)
async def purchase_subscription(
    request: CustomerSubscriptionPurchaseRequest,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.purchase_plan(request, auth_context)
