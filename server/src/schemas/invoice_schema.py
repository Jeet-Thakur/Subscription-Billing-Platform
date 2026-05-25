"""Invoice related Pydantic schemas.

Models describing invoice responses and collections used by invoice
endpoints and reporting surfaces.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class InvoiceResponse(BaseModel):
    id: UUID
    invoice_number: str
    organization_id: UUID
    organization_name: str
    customer_id: UUID
    customer_name: str
    customer_email: str
    subscription_id: UUID
    plan_id: UUID
    plan_name: str
    billing_interval: str
    amount: Decimal
    currency: str
    subtotal: Decimal
    total: Decimal
    invoice_status: str
    created_at: datetime
    paid_at: datetime | None


class CustomerInvoiceHistoryResponse(BaseModel):
    invoices: list[InvoiceResponse]


class OrganizationInvoiceListResponse(BaseModel):
    invoices: list[InvoiceResponse]
