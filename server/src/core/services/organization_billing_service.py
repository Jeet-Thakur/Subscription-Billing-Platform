from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions.service_exceptions import (
    ActiveSubscriptionsExistException,
    CustomerNotFoundException,
    InvoiceNotFoundException,
    InactiveCustomerException,
    InactiveUserException,
    InsufficientPermissionsException,
    OrganizationNotFoundException,
    PlanNotFoundException,
    SubscriptionAlreadyExistsException,
    SubscriptionNotFoundException,
    UserNotFoundException,
)
from src.data.repositories.organization_repository import OrganizationRepository
from src.data.repositories.customer_repository import CustomerRepository
from src.data.repositories.invoice_repository import InvoiceRepository
from src.data.repositories.payment_repository import PaymentRepository
from src.data.repositories.plan_repository import PlanRepository
from src.data.repositories.subscription_repository import SubscriptionRepository
from src.data.repositories.user_repository import UserRepository
from src.schemas.auth_schema import AuthenticatedUserContext
from src.schemas.dashboard_schema import (
    DashboardSummaryResponse,
    RecentSubscriptionResponse,
    RevenueByPlanResponse,
    SubscriptionCountByPlanResponse,
)
from src.schemas.invoice_schema import InvoiceResponse
from src.schemas.plan_schema import PlanCreateRequest, PlanUpdateRequest
from src.schemas.subscription_schema import (
    CustomerSubscriptionPurchaseRequest,
    CustomerSubscriptionPurchaseResponse,
    OrganizationSubscriptionResponse,
    SubscriptionCustomerResponse,
    SubscriptionPlanResponse,
)


class OrganizationBillingService:
    ADMIN_ROLE = "admin"

    def __init__(self, db: AsyncSession):
        self.customer_repository = CustomerRepository(db)
        self.invoice_repository = InvoiceRepository(db)
        self.organization_repository = OrganizationRepository(db)
        self.payment_repository = PaymentRepository(db)
        self.plan_repository = PlanRepository(db)
        self.subscription_repository = SubscriptionRepository(db)
        self.user_repository = UserRepository(db)

    async def create_plan(self, request: PlanCreateRequest, auth_context: AuthenticatedUserContext):
        actor = await self._get_admin_user(auth_context)

        return await self.plan_repository.create_plan(
            organization_id=actor.organization_id,
            name=request.name,
            description=request.description,
            billing_interval=request.billing_interval,
            price=request.price,
            currency=request.currency,
            trial_days=request.trial_days
        )

    async def list_organization_plans(self, auth_context: AuthenticatedUserContext):
        actor = await self._get_organization_user(auth_context)

        return await self.plan_repository.list_by_organization(actor.organization_id)

    async def get_plan(self, plan_id: UUID, auth_context: AuthenticatedUserContext):
        actor = await self._get_organization_user(auth_context)

        plan = await self.plan_repository.get_by_id_and_organization(plan_id, actor.organization_id)

        if not plan:
            raise PlanNotFoundException(identifier=str(None))

        return plan

    async def update_plan(self, plan_id: UUID, request: PlanUpdateRequest, auth_context: AuthenticatedUserContext):
        actor = await self._get_admin_user(auth_context)

        plan = await self.plan_repository.get_by_id_and_organization(plan_id, actor.organization_id)

        if not plan:
            raise PlanNotFoundException(identifier=str(None))

        update_data = request.model_dump(exclude_unset=True)

        return await self.plan_repository.update_plan(plan, update_data)

    async def activate_plan(self, plan_id: UUID, auth_context: AuthenticatedUserContext):
        actor = await self._get_admin_user(auth_context)

        plan = await self.plan_repository.get_by_id_and_organization(
            plan_id,
            actor.organization_id,
            include_inactive=True
        )

        if not plan:
            raise PlanNotFoundException(identifier=str(None))

        return await self.plan_repository.update_plan(plan, {"is_active": True})

    async def deactivate_plan(self, plan_id: UUID, auth_context: AuthenticatedUserContext):
        actor = await self._get_admin_user(auth_context)

        plan = await self.plan_repository.get_by_id_and_organization(plan_id, actor.organization_id)

        if not plan:
            raise PlanNotFoundException(identifier=str(None))

        return await self.plan_repository.update_plan(plan, {"is_active": False})

    async def delete_plan(self, plan_id: UUID, auth_context: AuthenticatedUserContext):
        actor = await self._get_admin_user(auth_context)

        plan = await self.plan_repository.get_by_id_and_organization(plan_id, actor.organization_id)

        if not plan:
            raise PlanNotFoundException(identifier=str(None))

        has_active_subscriptions = await self.subscription_repository.has_active_subscriptions_for_plan(
            organization_id=actor.organization_id,
            plan_id=plan.id
        )

        if has_active_subscriptions:
            raise ActiveSubscriptionsExistException(identifier=str(None))

        await self.plan_repository.update_plan(plan, {"is_active": False})

        return {"message": "Plan deactivated successfully"}

    async def list_subscriptions(
        self,
        auth_context: AuthenticatedUserContext,
        status: str | None = None,
        plan_id: UUID | None = None,
        customer_id: UUID | None = None
    ) -> list[OrganizationSubscriptionResponse]:
        actor = await self._get_admin_user(auth_context)

        subscriptions = await self.subscription_repository.list_by_organization(
            organization_id=actor.organization_id,
            status=status,
            plan_id=plan_id,
            customer_id=customer_id
        )

        return [self._build_subscription_response(subscription) for subscription in subscriptions]

    async def get_subscription(self, subscription_id: UUID, auth_context: AuthenticatedUserContext) -> OrganizationSubscriptionResponse:
        actor = await self._get_admin_user(auth_context)

        subscription = await self.subscription_repository.get_by_id_and_organization(
            subscription_id=subscription_id,
            organization_id=actor.organization_id
        )

        if not subscription:
            raise SubscriptionNotFoundException(identifier=str(None))

        return self._build_subscription_response(subscription)

    async def list_active_subscriptions(self, auth_context: AuthenticatedUserContext) -> list[OrganizationSubscriptionResponse]:
        return await self.list_subscriptions(auth_context=auth_context, status="active")

    async def list_cancelled_subscriptions(self, auth_context: AuthenticatedUserContext) -> list[OrganizationSubscriptionResponse]:
        return await self.list_subscriptions(auth_context=auth_context, status="cancelled")

    async def list_expiring_subscriptions(
        self,
        auth_context: AuthenticatedUserContext,
        days: int
    ) -> list[OrganizationSubscriptionResponse]:
        actor = await self._get_admin_user(auth_context)

        subscriptions = await self.subscription_repository.list_expiring_by_organization(
            organization_id=actor.organization_id,
            days=days
        )

        return [self._build_subscription_response(subscription) for subscription in subscriptions]

    async def get_dashboard_summary(
        self,
        auth_context: AuthenticatedUserContext,
        recent_limit: int
    ) -> DashboardSummaryResponse:
        actor = await self._get_admin_user(auth_context)

        total_subscriptions_count = await self.subscription_repository.get_total_subscriptions_count(actor.organization_id)
        active_subscriptions_count = await self.subscription_repository.get_active_subscriptions_count(actor.organization_id)
        cancelled_subscriptions_count = await self.subscription_repository.get_cancelled_subscriptions_count(actor.organization_id)
        monthly_recurring_revenue = await self.subscription_repository.get_monthly_recurring_revenue(actor.organization_id)
        revenue_by_plan_rows = await self.subscription_repository.get_revenue_grouped_by_plan(actor.organization_id)
        subscription_count_rows = await self.subscription_repository.get_subscription_count_grouped_by_plan(actor.organization_id)
        recent_subscriptions = await self.subscription_repository.get_recent_subscriptions(actor.organization_id, recent_limit)

        return DashboardSummaryResponse(
            total_subscriptions_count=total_subscriptions_count,
            active_subscriptions_count=active_subscriptions_count,
            cancelled_subscriptions_count=cancelled_subscriptions_count,
            monthly_recurring_revenue=monthly_recurring_revenue,
            revenue_by_plan=[
                RevenueByPlanResponse(
                    plan_id=row.id,
                    plan_name=row.name,
                    currency=row.currency,
                    revenue=row.revenue
                )
                for row in revenue_by_plan_rows
            ],
            subscription_count_by_plan=[
                SubscriptionCountByPlanResponse(
                    plan_id=row.id,
                    plan_name=row.name,
                    subscription_count=row.subscription_count
                )
                for row in subscription_count_rows
            ],
            recent_subscriptions=[
                RecentSubscriptionResponse(
                    subscription_id=subscription.id,
                    status=subscription.status,
                    created_at=subscription.created_at,
                    customer_id=subscription.customer.id,
                    customer_email=subscription.customer.email,
                    customer_name=subscription.customer.name,
                    plan_id=subscription.plan.id,
                    plan_name=subscription.plan.name
                )
                for subscription in recent_subscriptions
            ]
        )

    async def list_available_plans(self, auth_context: AuthenticatedUserContext):
        await self._ensure_authenticated_actor(auth_context)

        return await self.plan_repository.list_active_plans()

    async def get_available_plan(self, plan_id: UUID, auth_context: AuthenticatedUserContext):
        await self._ensure_authenticated_actor(auth_context)

        plan = await self.plan_repository.get_active_by_id(plan_id)

        if not plan:
            raise PlanNotFoundException(identifier=str(None))

        return plan

    async def get_organization_name(self, organization_id: UUID, auth_context: AuthenticatedUserContext):
        await self._ensure_authenticated_actor(auth_context)

        organization = await self.organization_repository.get_by_id(organization_id)

        if not organization:
            raise OrganizationNotFoundException(identifier=str(None))

        return organization

    async def list_organization_invoices(self, auth_context: AuthenticatedUserContext) -> list[InvoiceResponse]:
        actor = await self._get_admin_user(auth_context)

        invoices = await self.invoice_repository.list_by_organization(actor.organization_id)

        return [self._build_invoice_response(invoice) for invoice in invoices]

    async def get_organization_invoice(self, invoice_id: UUID, auth_context: AuthenticatedUserContext) -> InvoiceResponse:
        actor = await self._get_admin_user(auth_context)

        invoice = await self.invoice_repository.get_by_id_and_organization(invoice_id, actor.organization_id)

        if not invoice:
            raise InvoiceNotFoundException(identifier=str(None))

        return self._build_invoice_response(invoice)

    async def list_customer_invoices(self, auth_context: AuthenticatedUserContext) -> list[InvoiceResponse]:
        customer = await self._get_customer(auth_context)

        invoices = await self.invoice_repository.list_by_customer(customer.id)

        return [self._build_invoice_response(invoice) for invoice in invoices]

    async def get_customer_invoice(self, invoice_id: UUID, auth_context: AuthenticatedUserContext) -> InvoiceResponse:
        customer = await self._get_customer(auth_context)

        invoice = await self.invoice_repository.get_by_id_and_customer(invoice_id, customer.id)

        if not invoice:
            raise InvoiceNotFoundException(identifier=str(None))

        return self._build_invoice_response(invoice)

    async def purchase_plan(
        self,
        request: CustomerSubscriptionPurchaseRequest,
        auth_context: AuthenticatedUserContext
    ) -> CustomerSubscriptionPurchaseResponse:
        customer = await self._get_customer(auth_context)

        plan = await self.plan_repository.get_active_by_id(request.plan_id)

        if not plan:
            raise PlanNotFoundException(identifier=str(None))

        existing_subscription = await self.subscription_repository.get_active_by_customer_and_plan(
            customer_id=customer.id,
            plan_id=plan.id
        )

        if existing_subscription:
            raise SubscriptionAlreadyExistsException(identifier=str(None))

        period_start = datetime.now(UTC)
        period_end = self._build_period_end(period_start, plan.billing_interval)

        subscription = await self.subscription_repository.create_subscription(
            organization_id=plan.organization_id,
            customer_id=customer.id,
            plan_id=plan.id,
            status="active",
            current_period_start=period_start,
            current_period_end=period_end,
            cancel_at_period_end=False,
            cancelled_at=None,
            started_at=period_start
        )

        invoice_number = self._build_invoice_number(subscription.id)
        invoice = await self.invoice_repository.create_invoice(
            organization_id=plan.organization_id,
            customer_id=customer.id,
            subscription_id=subscription.id,
            invoice_number=invoice_number,
            subtotal=plan.price,
            tax_amount=Decimal("0"),
            discount_amount=Decimal("0"),
            total=plan.price,
            due_date=period_start,
            paid_at=period_start
        )

        await self.payment_repository.create_payment(
            organization_id=plan.organization_id,
            invoice_id=invoice.id,
            customer_id=customer.id,
            gateway="static",
            gateway_payment_id=self._build_gateway_payment_id(),
            amount=plan.price,
            currency=plan.currency,
            status="success",
            attempt_count=1,
            paid_at=period_start
        )

        created_subscription = await self.subscription_repository.get_by_id_and_organization(
            subscription_id=subscription.id,
            organization_id=plan.organization_id
        )

        created_invoice = await self.invoice_repository.get_by_id(invoice.id)

        return CustomerSubscriptionPurchaseResponse(
            subscription=self._build_subscription_response(created_subscription),
            invoice=self._build_invoice_response(created_invoice)
        )

    async def _get_admin_user(self, auth_context: AuthenticatedUserContext):
        user = await self._get_organization_user(auth_context)

        if user.role.lower() != self.ADMIN_ROLE:
            raise InsufficientPermissionsException()

        return user

    async def _get_organization_user(self, auth_context: AuthenticatedUserContext):
        if auth_context.actor_type and auth_context.actor_type != "user":
            raise InsufficientPermissionsException()

        user = None

        if auth_context.user_id:
            user = await self.user_repository.get_by_id(auth_context.user_id)

        if not user and auth_context.email:
            user = await self.user_repository.get_by_email(auth_context.email)

        if not user:
            raise UserNotFoundException(identifier=auth_context.subject)

        if not user.is_active:
            raise InactiveUserException(identifier=user.email)

        if auth_context.organization_id is None or user.organization_id != auth_context.organization_id:
            raise InsufficientPermissionsException()

        return user

    async def _get_customer(self, auth_context: AuthenticatedUserContext):
        if auth_context.actor_type != "customer":
            raise InsufficientPermissionsException()

        customer = None

        if auth_context.customer_id:
            customer = await self.customer_repository.get_by_id(auth_context.customer_id)

        if not customer and auth_context.email:
            customer = await self.customer_repository.get_by_email(auth_context.email)

        if not customer:
            raise CustomerNotFoundException(identifier=auth_context.subject)

        if not customer.is_active:
            raise InactiveCustomerException(identifier=customer.email)

        return customer

    async def _ensure_authenticated_actor(self, auth_context: AuthenticatedUserContext):
        if auth_context.actor_type == "customer":
            await self._get_customer(auth_context)
            return

        await self._get_organization_user(auth_context)

    def _build_period_end(self, period_start: datetime, billing_interval: str) -> datetime:
        normalized_interval = billing_interval.lower()

        if normalized_interval == "yearly" or normalized_interval == "annual":
            return period_start + timedelta(days=365)

        if normalized_interval == "weekly":
            return period_start + timedelta(days=7)

        if normalized_interval == "daily":
            return period_start + timedelta(days=1)

        return period_start + timedelta(days=30)

    def _build_invoice_number(self, subscription_id: UUID) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S")

        return f"INV-{timestamp}-{str(subscription_id)[:8].upper()}"

    def _build_gateway_payment_id(self) -> str:
        return f"PAY-{uuid4().hex[:12].upper()}"

    def _build_subscription_response(self, subscription) -> OrganizationSubscriptionResponse:
        return OrganizationSubscriptionResponse(
            id=subscription.id,
            organization_id=subscription.organization_id,
            customer_id=subscription.customer_id,
            plan_id=subscription.plan_id,
            status=subscription.status,
            current_period_start=subscription.current_period_start,
            current_period_end=subscription.current_period_end,
            cancel_at_period_end=subscription.cancel_at_period_end,
            cancelled_at=subscription.cancelled_at,
            started_at=subscription.started_at,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at,
            customer=SubscriptionCustomerResponse(
                id=subscription.customer.id,
                email=subscription.customer.email,
                name=subscription.customer.name
            ),
            plan=SubscriptionPlanResponse(
                id=subscription.plan.id,
                name=subscription.plan.name,
                billing_interval=subscription.plan.billing_interval,
                price=subscription.plan.price,
                currency=subscription.plan.currency,
                is_active=subscription.plan.is_active
            )
        )

    def _build_invoice_response(self, invoice) -> InvoiceResponse:
        payment = invoice.payments[0] if invoice.payments else None
        plan = invoice.subscription.plan
        invoice_status = "paid" if payment and payment.status.lower() == "success" else payment.status if payment else "paid"

        return InvoiceResponse(
            id=invoice.id,
            invoice_number=invoice.invoice_number,
            organization_id=invoice.organization_id,
            organization_name=invoice.organization.name,
            customer_id=invoice.customer_id,
            customer_name=invoice.customer.name,
            customer_email=invoice.customer.email,
            subscription_id=invoice.subscription_id,
            plan_id=plan.id,
            plan_name=plan.name,
            billing_interval=plan.billing_interval,
            amount=invoice.total,
            currency=payment.currency if payment else plan.currency,
            subtotal=invoice.subtotal,
            total=invoice.total,
            invoice_status=invoice_status,
            created_at=invoice.created_at,
            paid_at=invoice.paid_at
        )
