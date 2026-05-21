from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.data.models.postgres.plan import Plan


class PlanRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_plan(
        self,
        organization_id: UUID,
        name: str,
        description: str | None,
        billing_interval: str,
        price: Decimal,
        currency: str,
        trial_days: int | None,
        is_active: bool = True
    ) -> Plan:
        plan = Plan(
            organization_id=organization_id,
            name=name,
            description=description,
            billing_interval=billing_interval,
            price=price,
            currency=currency,
            trial_days=trial_days,
            is_active=is_active
        )

        self.db.add(plan)
        await self.db.flush()

        return plan

    async def list_by_organization(self, organization_id: UUID, include_inactive: bool = True) -> list[Plan]:
        query = select(Plan).where(
            Plan.organization_id == organization_id
        )

        if not include_inactive:
            query = query.where(Plan.is_active.is_(True))

        query = query.order_by(Plan.created_at.desc())

        result = await self.db.execute(query)

        return list(result.scalars().all())

    async def get_by_id_and_organization(
        self,
        plan_id: UUID,
        organization_id: UUID,
        include_inactive: bool = False
    ) -> Plan | None:
        query = select(Plan).where(
            Plan.id == plan_id,
            Plan.organization_id == organization_id
        )

        if not include_inactive:
            query = query.where(Plan.is_active.is_(True))

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def list_active_plans(self) -> list[Plan]:
        query = select(Plan).where(
            Plan.is_active.is_(True)
        ).order_by(Plan.created_at.desc())

        result = await self.db.execute(query)

        return list(result.scalars().all())

    async def get_active_by_id(self, plan_id: UUID) -> Plan | None:
        query = select(Plan).where(
            Plan.id == plan_id,
            Plan.is_active.is_(True)
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def update_plan(self, plan: Plan, update_data: dict) -> Plan:
        for field_name, field_value in update_data.items():
            setattr(plan, field_name, field_value)

        await self.db.flush()
        await self.db.refresh(plan)

        return plan
