"""Organization repository.

Data access methods for organization lookup and creation.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.data.models.postgres.organization import Organization


class OrganizationRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, organization_id: UUID) -> Organization | None:
        query = select(Organization).where(
            Organization.id == organization_id
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Organization | None:
        query = select(Organization).where(
            Organization.slug == slug
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def create_organization(
        self,
        name: str,
        slug: str,
        billing_email: str,
        stripe_account_id: str | None
    ) -> Organization:
        organization = Organization(
            name=name,
            slug=slug,
            billing_email=billing_email,
            stripe_account_id=stripe_account_id
        )

        self.db.add(organization)
        await self.db.flush()

        return organization
