"""refactor customers to account model

Revision ID: a4c1d7d5c2b1
Revises: 8e88758d6267
Create Date: 2026-05-19 22:20:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a4c1d7d5c2b1"
down_revision: Union[str, Sequence[str], None] = "8e88758d6267"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "customers",
        sa.Column("hashed_password", sa.String(), server_default="", nullable=False)
    )
    op.add_column(
        "customers",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False)
    )
    op.create_unique_constraint("uq_customers_email", "customers", ["email"])
    op.drop_index(op.f("ix_customers_external_customer_id"), table_name="customers")
    op.drop_index(op.f("ix_customers_organization_id"), table_name="customers")
    op.drop_constraint("customers_organization_id_fkey", "customers", type_="foreignkey")
    op.drop_column("customers", "billing_address")
    op.drop_column("customers", "external_customer_id")
    op.drop_column("customers", "organization_id")


def downgrade() -> None:
    op.add_column(
        "customers",
        sa.Column("billing_address", postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True)
    )
    op.add_column(
        "customers",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), autoincrement=False, nullable=False)
    )
    op.add_column(
        "customers",
        sa.Column("external_customer_id", sa.VARCHAR(), autoincrement=False, nullable=True)
    )
    op.create_foreign_key(
        "customers_organization_id_fkey",
        "customers",
        "organizations",
        ["organization_id"],
        ["id"],
    )
    op.create_index(op.f("ix_customers_organization_id"), "customers", ["organization_id"], unique=False)
    op.create_index(op.f("ix_customers_external_customer_id"), "customers", ["external_customer_id"], unique=False)
    op.drop_constraint("uq_customers_email", "customers", type_="unique")
    op.drop_column("customers", "is_active")
    op.drop_column("customers", "hashed_password")
