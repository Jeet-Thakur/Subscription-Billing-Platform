from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.data.clients.postgres import Base


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    organization_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("organizations.id"),
        index=True,
        nullable=False
    )

    customer_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("customers.id"),
        index=True,
        nullable=False
    )

    provider: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    provider_payment_method_id: Mapped[str] = mapped_column(
        String,
        index=True,
        nullable=False
    )

    brand: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    last4: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    expiry_month: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    expiry_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    is_default: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="payment_methods"
    )

    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="payment_methods"
    )
