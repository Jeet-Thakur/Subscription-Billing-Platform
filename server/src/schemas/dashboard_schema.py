"""Dashboard response schemas.

Defines aggregated dashboard response types such as revenue summaries
and recent subscription lists used by the organization dashboard APIs.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class RevenueByPlanResponse(BaseModel):
    plan_id: UUID
    plan_name: str
    currency: str
    revenue: Decimal


class SubscriptionCountByPlanResponse(BaseModel):
    plan_id: UUID
    plan_name: str
    subscription_count: int


class RecentSubscriptionResponse(BaseModel):
    subscription_id: UUID
    status: str
    created_at: datetime
    customer_id: UUID
    customer_email: str
    customer_name: str
    plan_id: UUID
    plan_name: str


class DashboardSummaryResponse(BaseModel):
    total_subscriptions_count: int
    active_subscriptions_count: int
    cancelled_subscriptions_count: int
    monthly_recurring_revenue: Decimal
    revenue_by_plan: list[RevenueByPlanResponse]
    subscription_count_by_plan: list[SubscriptionCountByPlanResponse]
    recent_subscriptions: list[RecentSubscriptionResponse]
