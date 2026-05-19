from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.data.models.postgres.user import User


class UserRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        query = select(User).where(
            User.id == user_id
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:

        query = select(User).where(
            User.email == email
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def create_user(
        self,
        organization_id: UUID,
        email: str,
        hashed_password: str,
        role: str,
        is_active: bool = True
    ) -> User:

        user = User(
            organization_id=organization_id,
            email=email,
            hashed_password=hashed_password,
            role=role,
            is_active=is_active
        )

        self.db.add(user)
        await self.db.flush()

        return user
