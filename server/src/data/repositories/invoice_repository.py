"""Invoice repository functions.

Create and query invoice records, with helpful methods to fetch invoices
by organization or customer including related entities.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.data.models.postgres.invoice import Invoice
from src.data.models.postgres.subscription import Subscription


class InvoiceRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_invoice(
        self,
        organization_id: UUID,
        customer_id: UUID,
        subscription_id: UUID,
        invoice_number: str,
        subtotal: Decimal,
        tax_amount: Decimal,
        discount_amount: Decimal,
        total: Decimal,
        due_date: datetime,
        paid_at: datetime | None,
        pdf_url: str | None = None
    ) -> Invoice:
        invoice = Invoice(
            organization_id=organization_id,
            customer_id=customer_id,
            subscription_id=subscription_id,
            invoice_number=invoice_number,
            subtotal=subtotal,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            total=total,
            due_date=due_date,
            paid_at=paid_at,
            pdf_url=pdf_url
        )

        self.db.add(invoice)
        await self.db.flush()

        return invoice

    async def get_by_id_and_organization(self, invoice_id: UUID, organization_id: UUID) -> Invoice | None:
        query = (
            select(Invoice)
            .options(
                joinedload(Invoice.organization),
                joinedload(Invoice.customer),
                joinedload(Invoice.subscription).joinedload(Subscription.plan),
                joinedload(Invoice.payments),
            )
            .where(
                Invoice.id == invoice_id,
                Invoice.organization_id == organization_id
            )
        )

        result = await self.db.execute(query)

        return result.unique().scalar_one_or_none()

    async def list_by_organization(self, organization_id: UUID) -> list[Invoice]:
        query = (
            select(Invoice)
            .options(
                joinedload(Invoice.organization),
                joinedload(Invoice.customer),
                joinedload(Invoice.subscription).joinedload(Subscription.plan),
                joinedload(Invoice.payments),
            )
            .where(Invoice.organization_id == organization_id)
            .order_by(Invoice.created_at.desc())
        )

        result = await self.db.execute(query)

        return list(result.unique().scalars().all())

    async def get_by_id_and_customer(self, invoice_id: UUID, customer_id: UUID) -> Invoice | None:
        query = (
            select(Invoice)
            .options(
                joinedload(Invoice.organization),
                joinedload(Invoice.customer),
                joinedload(Invoice.subscription).joinedload(Subscription.plan),
                joinedload(Invoice.payments),
            )
            .where(
                Invoice.id == invoice_id,
                Invoice.customer_id == customer_id
            )
        )

        result = await self.db.execute(query)

        return result.unique().scalar_one_or_none()

    async def list_by_customer(self, customer_id: UUID) -> list[Invoice]:
        query = (
            select(Invoice)
            .options(
                joinedload(Invoice.organization),
                joinedload(Invoice.customer),
                joinedload(Invoice.subscription).joinedload(Subscription.plan),
                joinedload(Invoice.payments),
            )
            .where(Invoice.customer_id == customer_id)
            .order_by(Invoice.created_at.desc())
        )

        result = await self.db.execute(query)

        return list(result.unique().scalars().all())

    async def get_by_id(self, invoice_id: UUID) -> Invoice | None:
        query = (
            select(Invoice)
            .options(
                joinedload(Invoice.organization),
                joinedload(Invoice.customer),
                joinedload(Invoice.subscription).joinedload(Subscription.plan),
                joinedload(Invoice.payments),
            )
            .where(Invoice.id == invoice_id)
        )

        result = await self.db.execute(query)

        return result.unique().scalar_one_or_none()
