"""Organization invoice routes.

Provides endpoints to list and retrieve invoices for organizations and
customers.
"""

from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer

from src.api.rest.dependencies import (
    get_authenticated_user_context,
    get_organization_billing_service,
)
from src.core.services.organization_billing_service import OrganizationBillingService
from src.schemas.auth_schema import AuthenticatedUserContext
from src.schemas.invoice_schema import InvoiceResponse

router = APIRouter(prefix="/organization/invoices", tags=["Organization Invoices"])
customer_router = APIRouter(prefix="/invoices", tags=["Invoices"])
security = HTTPBearer()


@router.get("", response_model=list[InvoiceResponse])
async def get_organization_invoices(
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.list_organization_invoices(auth_context)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_organization_invoice(
    invoice_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.get_organization_invoice(invoice_id, auth_context)


@customer_router.get("", response_model=list[InvoiceResponse])
async def get_customer_invoices(
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.list_customer_invoices(auth_context)


@customer_router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_customer_invoice(
    invoice_id: UUID,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    billing_service: OrganizationBillingService = Depends(get_organization_billing_service)
):
    return await billing_service.get_customer_invoice(invoice_id, auth_context)
