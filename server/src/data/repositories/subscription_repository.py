"""Subscription repository operations.

Contains methods to create, query and aggregate subscriptions for an
organization. Uses SQLAlchemy AsyncSession for DB interaction.
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import case, func, literal, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.data.models.postgres.invoice import Invoice
from src.data.models.postgres.payment import Payment
from src.data.models.postgres.plan import Plan
from src.data.models.postgres.subscription import Subscription


class SubscriptionRepository:
    ACTIVE_STATUS = "active"
    CANCELLED_STATUS = "cancelled"

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_subscription(
        self,
        organization_id: UUID,
        customer_id: UUID,
        plan_id: UUID,
        status: str,
        current_period_start: datetime | None,
        current_period_end: datetime | None,
        cancel_at_period_end: bool,
        cancelled_at: datetime | None,
        started_at: datetime | None
    ) -> Subscription:
        subscription = Subscription(
            organization_id=organization_id,
            customer_id=customer_id,
            plan_id=plan_id,
            status=status,
            current_period_start=current_period_start,
            current_period_end=current_period_end,
            cancel_at_period_end=cancel_at_period_end,
            cancelled_at=cancelled_at,
            started_at=started_at
        )

        self.db.add(subscription)
        await self.db.flush()

        return subscription

    async def get_by_id_and_organization(self, subscription_id: UUID, organization_id: UUID) -> Subscription | None:
        query = (
            select(Subscription)
            .options(
                joinedload(Subscription.plan),
                joinedload(Subscription.customer),
            )
            .where(
                Subscription.id == subscription_id,
                Subscription.organization_id == organization_id
            )
        )

        result = await self.db.execute(query)

        return result.unique().scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: UUID,
        status: str | None = None,
        plan_id: UUID | None = None,
        customer_id: UUID | None = None
    ) -> list[Subscription]:
        query = (
            select(Subscription)
            .options(
                joinedload(Subscription.plan),
                joinedload(Subscription.customer),
            )
            .where(Subscription.organization_id == organization_id)
        )

        if status:
            query = query.where(
                func.lower(Subscription.status) == status.lower()
            )

        if plan_id:
            query = query.where(Subscription.plan_id == plan_id)

        if customer_id:
            query = query.where(Subscription.customer_id == customer_id)

        query = query.order_by(Subscription.created_at.desc())

        result = await self.db.execute(query)

        return list(result.unique().scalars().all())

    async def get_active_by_customer_and_plan(self, customer_id: UUID, plan_id: UUID) -> Subscription | None:
        query = (
            select(Subscription)
            .options(
                joinedload(Subscription.plan),
                joinedload(Subscription.customer),
            )
            .where(
                Subscription.customer_id == customer_id,
                Subscription.plan_id == plan_id,
                func.lower(Subscription.status) == self.ACTIVE_STATUS
            )
        )

        result = await self.db.execute(query)

        return result.unique().scalar_one_or_none()

    async def list_expiring_by_organization(self, organization_id: UUID, days: int) -> list[Subscription]:
        now = datetime.now(UTC)
        end_date = now + timedelta(days=days)

        query = (
            select(Subscription)
            .options(
                joinedload(Subscription.plan),
                joinedload(Subscription.customer),
            )
            .where(
                Subscription.organization_id == organization_id,
                func.lower(Subscription.status) == self.ACTIVE_STATUS,
                Subscription.current_period_end.is_not(None),
                Subscription.current_period_end >= now,
                Subscription.current_period_end <= end_date
            )
            .order_by(Subscription.current_period_end.asc())
        )

        result = await self.db.execute(query)

        return list(result.unique().scalars().all())

    async def has_active_subscriptions_for_plan(self, organization_id: UUID, plan_id: UUID) -> bool:
        query = select(func.count(Subscription.id)).where(
            Subscription.organization_id == organization_id,
            Subscription.plan_id == plan_id,
            func.lower(Subscription.status) == self.ACTIVE_STATUS
        )

        result = await self.db.execute(query)

        active_count = result.scalar_one()

        return bool(active_count)

    async def get_total_subscriptions_count(self, organization_id: UUID) -> int:
        query = select(func.count(Subscription.id)).where(
            Subscription.organization_id == organization_id
        )

        result = await self.db.execute(query)

        return int(result.scalar_one() or 0)

    async def get_active_subscriptions_count(self, organization_id: UUID) -> int:
        query = select(func.count(Subscription.id)).where(
            Subscription.organization_id == organization_id,
            func.lower(Subscription.status) == self.ACTIVE_STATUS
        )

        result = await self.db.execute(query)

        return int(result.scalar_one() or 0)

    async def get_cancelled_subscriptions_count(self, organization_id: UUID) -> int:
        query = select(func.count(Subscription.id)).where(
            Subscription.organization_id == organization_id,
            func.lower(Subscription.status) == self.CANCELLED_STATUS
        )

        result = await self.db.execute(query)

        return int(result.scalar_one() or 0)

    async def get_monthly_recurring_revenue(self, organization_id: UUID) -> Decimal:
        normalized_price = case(
            (func.lower(Plan.billing_interval) == "yearly", Plan.price / literal(12)),
            (func.lower(Plan.billing_interval) == "annual", Plan.price / literal(12)),
            (func.lower(Plan.billing_interval) == "weekly", Plan.price * literal(4)),
            (func.lower(Plan.billing_interval) == "daily", Plan.price * literal(30)),
            else_=Plan.price
        )

        query = (
            select(func.coalesce(func.sum(normalized_price), 0))
            .select_from(Subscription)
            .join(Plan, Plan.id == Subscription.plan_id)
            .where(
                Subscription.organization_id == organization_id,
                func.lower(Subscription.status) == self.ACTIVE_STATUS
            )
        )

        result = await self.db.execute(query)

        return result.scalar_one() or Decimal("0")

    async def get_revenue_grouped_by_plan(self, organization_id: UUID) -> list[tuple]:
        query = (
            select(
                Plan.id,
                Plan.name,
                Plan.currency,
                func.coalesce(func.sum(Payment.amount), 0).label("revenue")
            )
            .select_from(Plan)
            .outerjoin(Subscription, Subscription.plan_id == Plan.id)
            .outerjoin(
                Invoice,
                (Invoice.subscription_id == Subscription.id) &
                (Invoice.organization_id == organization_id)
            )
            .outerjoin(
                Payment,
                (Payment.invoice_id == Invoice.id) &
                (Payment.organization_id == organization_id) &
                (func.lower(Payment.status) == "success")
            )
            .where(Plan.organization_id == organization_id)
            .group_by(Plan.id, Plan.name, Plan.currency)
            .order_by(Plan.created_at.desc())
        )

        result = await self.db.execute(query)

        return list(result.all())

    async def get_subscription_count_grouped_by_plan(self, organization_id: UUID) -> list[tuple]:
        query = (
            select(
                Plan.id,
                Plan.name,
                func.count(Subscription.id).label("subscription_count")
            )
            .select_from(Plan)
            .outerjoin(
                Subscription,
                (Subscription.plan_id == Plan.id) &
                (Subscription.organization_id == organization_id) &
                (func.lower(Subscription.status) == self.ACTIVE_STATUS)
            )
            .where(Plan.organization_id == organization_id)
            .group_by(Plan.id, Plan.name)
            .order_by(Plan.created_at.desc())
        )

        result = await self.db.execute(query)

        return list(result.all())

    async def get_recent_subscriptions(self, organization_id: UUID, limit: int) -> list[Subscription]:
        query = (
            select(Subscription)
            .options(
                joinedload(Subscription.plan),
                joinedload(Subscription.customer),
            )
            .where(Subscription.organization_id == organization_id)
            .order_by(Subscription.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(query)

        return list(result.unique().scalars().all())
