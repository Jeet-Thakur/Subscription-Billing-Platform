from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.data.models.postgres.customer import Customer


class CustomerRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, customer_id: UUID) -> Customer | None:
        query = select(Customer).where(
            Customer.id == customer_id
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Customer | None:
        query = select(Customer).where(
            Customer.email == email
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def create_customer(
        self,
        email: str,
        name: str,
        hashed_password: str,
        is_active: bool = True
    ) -> Customer:
        customer = Customer(
            email=email,
            name=name,
            hashed_password=hashed_password,
            is_active=is_active
        )

        self.db.add(customer)
        await self.db.flush()

        return customer
