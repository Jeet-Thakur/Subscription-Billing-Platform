"""Schemas for organization creation and responses.

Includes validation for required fields and normalization helpers for
slugs and billing emails used by organization-related endpoints.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class OrganizationCreateRequest(BaseModel):
    name: str
    slug: str
    billing_email: str
    stripe_account_id: str | None = None

    @field_validator("name", "slug", "billing_email")
    @classmethod
    def validate_required_fields(cls, value: str) -> str:
        normalized_value = value.strip()

        if not normalized_value:
            raise ValueError("Field cannot be empty")

        return normalized_value

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.lower()

    @field_validator("billing_email")
    @classmethod
    def normalize_billing_email(cls, value: str) -> str:
        return value.lower()


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    billing_email: str
    stripe_account_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrganizationNameResponse(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)
