from uuid import UUID

from pydantic import BaseModel, field_validator

from src.schemas.organization_schema import OrganizationCreateRequest, OrganizationResponse
from src.schemas.user_schema import OrganizationAdminCreateRequest, UserResponse


class OrganizationSignupRequest(BaseModel):
    organization: OrganizationCreateRequest
    user: OrganizationAdminCreateRequest


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized_value = value.strip().lower()

        if not normalized_value:
            raise ValueError("Email cannot be empty")

        return normalized_value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot be empty")

        return value


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OrganizationSignupResponse(AuthResponse):
    organization: OrganizationResponse
    user: UserResponse


class AuthenticatedUserContext(BaseModel):
    subject: str
    actor_type: str | None = None
    user_id: UUID | None = None
    customer_id: UUID | None = None
    organization_id: UUID | None = None
    email: str | None = None
    role: str | None = None
