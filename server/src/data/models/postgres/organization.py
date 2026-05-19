from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.data.clients.postgres import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    slug: Mapped[str] = mapped_column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    billing_email: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    stripe_account_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="organization"
    )

    plans: Mapped[list["Plan"]] = relationship(
        "Plan",
        back_populates="organization"
    )

    subscriptions: Mapped[list["Subscription"]] = relationship(
        "Subscription",
        back_populates="organization"
    )

    invoices: Mapped[list["Invoice"]] = relationship(
        "Invoice",
        back_populates="organization"
    )

    payments: Mapped[list["Payment"]] = relationship(
        "Payment",
        back_populates="organization"
    )

    payment_methods: Mapped[list["PaymentMethod"]] = relationship(
        "PaymentMethod",
        back_populates="organization"
    )
