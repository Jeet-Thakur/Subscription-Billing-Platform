"""Schemas for plan create/update and plan responses.

Defines the Pydantic models for creating, updating and returning plan
information used throughout the billing APIs.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class PlanCreateRequest(BaseModel):
    name: str
    description: str | None = None
    billing_interval: str
    price: Decimal
    currency: str
    trial_days: int | None = None

    @field_validator("name", "billing_interval", "currency")
    @classmethod
    def validate_required_strings(cls, value: str) -> str:
        normalized_value = value.strip()

        if not normalized_value:
            raise ValueError("Field cannot be empty")

        return normalized_value

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return value

        normalized_value = value.strip()

        return normalized_value or None

    @field_validator("billing_interval")
    @classmethod
    def normalize_billing_interval(cls, value: str) -> str:
        return value.lower()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("price")
    @classmethod
    def validate_price(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("Price must be greater than zero")

        return value

    @field_validator("trial_days")
    @classmethod
    def validate_trial_days(cls, value: int | None) -> int | None:
        if value is not None and value < 0:
            raise ValueError("Trial days cannot be negative")

        return value


class PlanUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    billing_interval: str | None = None
    price: Decimal | None = None
    currency: str | None = None
    trial_days: int | None = None
    is_active: bool | None = None

    @field_validator("name", "billing_interval", "currency")
    @classmethod
    def validate_optional_strings(cls, value: str | None) -> str | None:
        if value is None:
            return value

        normalized_value = value.strip()

        if not normalized_value:
            raise ValueError("Field cannot be empty")

        return normalized_value

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return value

        normalized_value = value.strip()

        return normalized_value or None

    @field_validator("billing_interval")
    @classmethod
    def normalize_billing_interval(cls, value: str | None) -> str | None:
        if value is None:
            return value

        return value.lower()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        if value is None:
            return value

        return value.upper()

    @field_validator("price")
    @classmethod
    def validate_price(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and value <= 0:
            raise ValueError("Price must be greater than zero")

        return value

    @field_validator("trial_days")
    @classmethod
    def validate_trial_days(cls, value: int | None) -> int | None:
        if value is not None and value < 0:
            raise ValueError("Trial days cannot be negative")

        return value


class PlanResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    description: str | None
    billing_interval: str
    price: Decimal
    currency: str
    trial_days: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
