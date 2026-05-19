from sqlalchemy.ext.asyncio import AsyncSession

from src.data.repositories.customer_repository import CustomerRepository
from src.data.repositories.organization_repository import OrganizationRepository
from src.data.repositories.user_repository import UserRepository

from src.core.security.JwtProvider import JWTProvider

from src.utils.crypt import (
    hash_password,
    verify_password
)

from src.schemas.auth_schema import (
    AuthenticatedUserContext,
    AuthResponse,
    LoginRequest,
    OrganizationSignupRequest,
)
from src.schemas.customer_schema import CustomerCreateRequest, CustomerRegistrationResponse
from src.schemas.user_schema import UserRegistrationRequest

from src.core.exceptions.service_exceptions import (
    CustomerAlreadyExistsException,
    InactiveCustomerException,
    InactiveUserException,
    InsufficientPermissionsException,
    UserAlreadyExistsException,
    InvalidCredentialsException,
    OrganizationAlreadyExistsException,
    UserNotFoundException,
)


class AuthService:
    ADMIN_ROLE = "admin"

    def __init__(self, db: AsyncSession):
        self.organization_repository = OrganizationRepository(db)
        self.customer_repository = CustomerRepository(db)
        self.user_repository = UserRepository(db)
        self.jwt_provider = JWTProvider()

    async def signup(self, request: OrganizationSignupRequest) -> tuple:
        organization = request.organization
        user = request.user

        existing_organization = await self.organization_repository.get_by_slug(organization.slug)
        if existing_organization:
            raise OrganizationAlreadyExistsException(slug=organization.slug)

        existing_user = await self.user_repository.get_by_email(user.email)
        if existing_user:
            raise UserAlreadyExistsException(identifier=user.email)

        created_organization = await self.organization_repository.create_organization(
            name=organization.name,
            slug=organization.slug,
            billing_email=organization.billing_email,
            stripe_account_id=organization.stripe_account_id
        )

        hashed_password = hash_password(user.password)

        created_user = await self.user_repository.create_user(
            organization_id=created_organization.id,
            email=user.email,
            hashed_password=hashed_password,
            role=self.ADMIN_ROLE
        )

        token = self._create_user_access_token(created_user)

        return created_organization, created_user, token

    async def login(self, request: LoginRequest) -> AuthResponse:
        user = await self.user_repository.get_by_email(request.email)

        if not user:
            raise InvalidCredentialsException()

        if not verify_password(request.password, user.hashed_password):
            raise InvalidCredentialsException()

        if not user.is_active:
            raise InactiveUserException(identifier=user.email)

        return AuthResponse(
            access_token=self._create_user_access_token(user)
        )

    async def register_user(self, request: UserRegistrationRequest, auth_context: AuthenticatedUserContext):
        actor = await self._get_active_user_from_context(auth_context)
        self._ensure_admin_role(actor.role)

        existing_user = await self.user_repository.get_by_email(request.email)
        if existing_user:
            raise UserAlreadyExistsException(identifier=request.email)

        hashed_password = hash_password(request.password)

        return await self.user_repository.create_user(
            organization_id=actor.organization_id,
            email=request.email,
            hashed_password=hashed_password,
            role=request.role
        )

    async def register_customer(self, request: CustomerCreateRequest) -> CustomerRegistrationResponse:
        existing_customer = await self.customer_repository.get_by_email(request.email)
        if existing_customer:
            raise CustomerAlreadyExistsException(identifier=request.email)

        hashed_password = hash_password(request.password)

        customer = await self.customer_repository.create_customer(
            email=request.email,
            name=request.name,
            hashed_password=hashed_password
        )

        return CustomerRegistrationResponse(
            access_token=self._create_customer_access_token(customer),
            customer=customer
        )

    async def login_customer(self, request: LoginRequest) -> AuthResponse:
        customer = await self.customer_repository.get_by_email(request.email)

        if not customer:
            raise InvalidCredentialsException()

        if not verify_password(request.password, customer.hashed_password):
            raise InvalidCredentialsException()

        if not customer.is_active:
            raise InactiveCustomerException(identifier=customer.email)

        return AuthResponse(
            access_token=self._create_customer_access_token(customer)
        )

    async def _get_active_user_from_context(self, auth_context: AuthenticatedUserContext):
        if auth_context.actor_type and auth_context.actor_type != "user":
            raise InsufficientPermissionsException()

        user = None

        if auth_context.user_id:
            user = await self.user_repository.get_by_id(auth_context.user_id)

        if not user and auth_context.email:
            user = await self.user_repository.get_by_email(auth_context.email)

        if not user:
            raise UserNotFoundException(identifier=auth_context.subject)

        if auth_context.organization_id and user.organization_id != auth_context.organization_id:
            raise UserNotFoundException(identifier=user.email)

        if not user.is_active:
            raise InactiveUserException(identifier=user.email)

        return user

    def _ensure_admin_role(self, role: str) -> None:
        if role.lower() != self.ADMIN_ROLE:
            raise InsufficientPermissionsException()

    def _create_user_access_token(self, user) -> str:
        return self.jwt_provider.create_access_token(
            subject=user.email,
            extra_claims={
                "actor_type": "user",
                "user_id": str(user.id),
                "organization_id": str(user.organization_id),
                "email": user.email,
                "role": user.role,
            }
        )

    def _create_customer_access_token(self, customer) -> str:
        return self.jwt_provider.create_access_token(
            subject=customer.email,
            extra_claims={
                "actor_type": "customer",
                "customer_id": str(customer.id),
                "email": customer.email,
            }
        )
