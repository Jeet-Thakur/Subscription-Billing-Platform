from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer

from src.api.rest.dependencies import (
    get_authenticated_user_context,
    get_organization_billing_service,
)
from src.core.services.organization_billing_service import OrganizationBillingService
from src.schemas.auth_schema import AuthenticatedUserContext
from src.schemas.plan_schema import PlanCreateRequest, PlanResponse, PlanUpdateRequest

router = APIRouter(prefix="/organization/plans", tags=["Organization Plans"])
customer_router = APIRouter(prefix="/plans", tags=["Plans"])
security = HTTPBearer()


@router.post("", response_model=PlanResponse)
async def create_plan(
    request: PlanCreateRequest,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plan = await billing_service.create_plan(request, auth_context)

    return PlanResponse.model_validate(plan)


@router.get("", response_model=list[PlanResponse])
async def get_organization_plans(
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plans = await billing_service.list_organization_plans(auth_context)

    return [PlanResponse.model_validate(plan) for plan in plans]


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plan = await billing_service.get_plan(plan_id, auth_context)

    return PlanResponse.model_validate(plan)


@router.patch("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: UUID,
    request: PlanUpdateRequest,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plan = await billing_service.update_plan(plan_id, request, auth_context)

    return PlanResponse.model_validate(plan)


@router.patch("/{plan_id}/activate", response_model=PlanResponse)
async def activate_plan(
    plan_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plan = await billing_service.activate_plan(plan_id, auth_context)

    return PlanResponse.model_validate(plan)


@router.patch("/{plan_id}/deactivate", response_model=PlanResponse)
async def deactivate_plan(
    plan_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plan = await billing_service.deactivate_plan(plan_id, auth_context)

    return PlanResponse.model_validate(plan)


@router.post("/{plan_id}/delete")
async def delete_plan(
    plan_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.delete_plan(plan_id, auth_context)


@customer_router.get("", response_model=list[PlanResponse])
async def get_available_plans(
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plans = await billing_service.list_available_plans(auth_context)

    return [PlanResponse.model_validate(plan) for plan in plans]


@customer_router.get("/{plan_id}", response_model=PlanResponse)
async def get_available_plan(
    plan_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    plan = await billing_service.get_available_plan(plan_id, auth_context)

    return PlanResponse.model_validate(plan)
