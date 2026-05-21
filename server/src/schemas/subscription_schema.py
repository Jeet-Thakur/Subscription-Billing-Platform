from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from src.schemas.invoice_schema import InvoiceResponse


class SubscriptionCustomerResponse(BaseModel):
    id: UUID
    email: str
    name: str


class SubscriptionPlanResponse(BaseModel):
    id: UUID
    name: str
    billing_interval: str
    price: Decimal
    currency: str
    is_active: bool


class OrganizationSubscriptionResponse(BaseModel):
    id: UUID
    organization_id: UUID
    customer_id: UUID
    plan_id: UUID
    status: str
    current_period_start: datetime | None
    current_period_end: datetime | None
    cancel_at_period_end: bool
    cancelled_at: datetime | None
    started_at: datetime | None
    created_at: datetime
    updated_at: datetime
    customer: SubscriptionCustomerResponse
    plan: SubscriptionPlanResponse


class CustomerSubscriptionPurchaseRequest(BaseModel):
    plan_id: UUID


class CustomerSubscriptionPurchaseResponse(BaseModel):
    subscription: OrganizationSubscriptionResponse
    invoice: InvoiceResponse
