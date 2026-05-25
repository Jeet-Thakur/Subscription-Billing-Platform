"""Pydantic schemas for user and organization admin requests/responses.

Defines request/response models used by authentication and user management
endpoints, including validation helpers for email and password fields.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class OrganizationAdminCreateRequest(BaseModel):
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


class UserRegistrationRequest(BaseModel):
    email: str
    password: str
    role: str

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

    @field_validator("role")
    @classmethod
    def normalize_role(cls, value: str) -> str:
        normalized_value = value.strip().lower()

        if not normalized_value:
            raise ValueError("Role cannot be empty")

        return normalized_value


class UserResponse(BaseModel):
    id: UUID
    organization_id: UUID
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserRegistrationResponse(BaseModel):
    user: UserResponse
