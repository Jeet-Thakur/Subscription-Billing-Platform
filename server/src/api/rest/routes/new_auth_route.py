from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer

from src.api.rest.dependencies import (
    get_authenticated_user_context,
    get_auth_service
)

from src.core.services.new_auth_service import AuthService

from src.schemas.auth_schema import (
    AuthenticatedUserContext,
    LoginRequest,
    AuthResponse,
    OrganizationSignupRequest,
    OrganizationSignupResponse,
)
from src.schemas.customer_schema import CustomerCreateRequest, CustomerRegistrationResponse, CustomerResponse
from src.schemas.organization_schema import OrganizationResponse
from src.schemas.user_schema import UserRegistrationRequest, UserRegistrationResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


@router.post("/signup", response_model=OrganizationSignupResponse)
async def signup(request: OrganizationSignupRequest, auth_service: AuthService = Depends(get_auth_service)):

    organization, user, token = await auth_service.signup(request)

    return OrganizationSignupResponse(
        access_token=token,
        organization=OrganizationResponse.model_validate(organization),
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):

    return await auth_service.login(request)


@router.post("/customers/login", response_model=AuthResponse)
async def login_customer(request: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):

    return await auth_service.login_customer(request)


@router.post("/users/register", response_model=UserRegistrationResponse)
async def register_user(
    request: UserRegistrationRequest,
    security: HTTPBearer = Depends(security),
    auth_context: AuthenticatedUserContext = Depends(get_authenticated_user_context),
    auth_service: AuthService = Depends(get_auth_service)
):
    user = await auth_service.register_user(request, auth_context)

    return UserRegistrationResponse(
        user=UserResponse.model_validate(user)
    )


@router.post("/customers/register", response_model=CustomerRegistrationResponse)
async def register_customer(
    request: CustomerCreateRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    response = await auth_service.register_customer(request)

    return CustomerRegistrationResponse(
        access_token=response.access_token,
        token_type=response.token_type,
        customer=CustomerResponse.model_validate(response.customer)
    )
