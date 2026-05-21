from collections.abc import AsyncGenerator
from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions.auth_exceptions import InvalidAuthorizationFormat, InvalidToken
from src.core.services.new_auth_service import AuthService
from src.core.services.organization_billing_service import OrganizationBillingService
from src.core.security.JwtProvider import JWTProvider
from src.schemas.auth_schema import AuthenticatedUserContext
from src.data.clients.postgres import async_session_local


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_local() as session:
        # this block is a context manager , it automatically closes the session
        try:
            yield session
            await session.commit()
            
        except Exception:
            await session.rollback()
            raise

async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:

    return AuthService(db)


async def get_organization_billing_service(db: AsyncSession = Depends(get_db)) -> OrganizationBillingService:

    return OrganizationBillingService(db)


def _parse_uuid_claim(value: str | None, claim_name: str) -> UUID | None:
    if value is None:
        return None

    try:
        return UUID(value)
    except ValueError as exc:
        raise InvalidToken(details=f"Token contains an invalid '{claim_name}' claim") from exc


async def get_authenticated_user_context(request: Request) -> AuthenticatedUserContext:
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise InvalidAuthorizationFormat(details="Authorization header missing")

    parts = auth_header.split()
    if len(parts) != 2:
        raise InvalidAuthorizationFormat()

    scheme, token = parts

    if scheme.lower() != "bearer":
        raise InvalidAuthorizationFormat()

    payload = JWTProvider().decode_token(token)

    return AuthenticatedUserContext(
        subject=payload["sub"],
        actor_type=payload.get("actor_type"),
        user_id=_parse_uuid_claim(payload.get("user_id"), "user_id"),
        customer_id=_parse_uuid_claim(payload.get("customer_id"), "customer_id"),
        organization_id=_parse_uuid_claim(payload.get("organization_id"), "organization_id"),
        email=payload.get("email"),
        role=payload.get("role"),
    )
