"""Customer request/response schemas.

Contains validation for customer creation and the responses returned on
registration and lookups.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class CustomerCreateRequest(BaseModel):
    email: str
    password: str
    name: str

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

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized_value = value.strip()

        if not normalized_value:
            raise ValueError("Name cannot be empty")

        return normalized_value


class CustomerResponse(BaseModel):
    id: UUID
    email: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerRegistrationResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerResponse
