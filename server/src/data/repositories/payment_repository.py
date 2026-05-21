from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.data.models.postgres.payment import Payment


class PaymentRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_payment(
        self,
        organization_id: UUID,
        invoice_id: UUID,
        customer_id: UUID,
        gateway: str,
        gateway_payment_id: str,
        amount: Decimal,
        currency: str,
        status: str,
        attempt_count: int,
        paid_at: datetime | None
    ) -> Payment:
        payment = Payment(
            organization_id=organization_id,
            invoice_id=invoice_id,
            customer_id=customer_id,
            gateway=gateway,
            gateway_payment_id=gateway_payment_id,
            amount=amount,
            currency=currency,
            status=status,
            attempt_count=attempt_count,
            paid_at=paid_at
        )

        self.db.add(payment)
        await self.db.flush()

        return payment
