# Standard library imports
# Third-party imports
# Local application imports

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.exceptions.auth_exceptions import InvalidToken, InvalidAuthorizationFormat, GeneralException
from src.core.exceptions.service_exceptions import (
    ActiveSubscriptionsExistException,
    CustomerAlreadyExistsException,
    CustomerNotFoundException,
    InvoiceNotFoundException,
    InactiveCustomerException,
    InactiveUserException,
    InsufficientPermissionsException,
    InvalidCredentialsException,
    OrganizationAlreadyExistsException,
    OrganizationNotFoundException,
    PlanNotFoundException,
    SubscriptionAlreadyExistsException,
    SubscriptionNotFoundException,
    UserAlreadyExistsException,
    UserNotFoundException,
)
from src.core.exceptions.handlers import (
    active_subscriptions_exist_handler,
    customer_already_exists_handler,
    customer_not_found_handler,
    invoice_not_found_handler,
    inactive_customer_handler,
    inactive_user_handler,
    insufficient_permissions_handler,
    invalid_token_handler,
    invalid_authorization_format_handler,
    general_exception_handler,
    user_already_exists_handler,
    organization_already_exists_handler,
    organization_not_found_handler,
    invalid_credentials_handler,
    user_not_found_handler,
    plan_not_found_handler,
    subscription_already_exists_handler,
    subscription_not_found_handler,
)
from src.config.settings import settings
from src.api.middleware.my_auth_middleware import MyAuthMiddleware
from src.api.rest.routes.organization_dashboard_route import (
    lookup_router as organization_lookup_router,
    router as organization_dashboard_router,
)
from src.api.rest.routes.organization_invoice_route import (
    customer_router as customer_invoice_router,
    router as organization_invoice_router,
)
from src.api.rest.routes.organization_plan_route import (
    customer_router as customer_plan_router,
    router as organization_plan_router,
)
from src.api.rest.routes.organization_subscription_route import (
    customer_router as customer_subscription_router,
    router as organization_subscription_router,
)
from src.api.rest.routes.new_auth_route import router as new_auth_router

import src.data.models.postgres
from src.data.clients.postgres import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("tables created")

    yield

    # alchemy keeps the engine and the internal pool alive, and doesnt close it automatically
    # dispose : shutting down the entire network connection 
    await engine.dispose()


app = FastAPI(lifespan=lifespan)

app.add_exception_handler(InvalidToken, invalid_token_handler)
app.add_exception_handler(InvalidAuthorizationFormat, invalid_authorization_format_handler)
app.add_exception_handler(GeneralException, general_exception_handler)
app.add_exception_handler(UserAlreadyExistsException, user_already_exists_handler)
app.add_exception_handler(CustomerAlreadyExistsException, customer_already_exists_handler)
app.add_exception_handler(OrganizationAlreadyExistsException, organization_already_exists_handler)
app.add_exception_handler(OrganizationNotFoundException, organization_not_found_handler)
app.add_exception_handler(InvoiceNotFoundException, invoice_not_found_handler)
app.add_exception_handler(PlanNotFoundException, plan_not_found_handler)
app.add_exception_handler(SubscriptionAlreadyExistsException, subscription_already_exists_handler)
app.add_exception_handler(SubscriptionNotFoundException, subscription_not_found_handler)
app.add_exception_handler(ActiveSubscriptionsExistException, active_subscriptions_exist_handler)
app.add_exception_handler(InvalidCredentialsException, invalid_credentials_handler)
app.add_exception_handler(UserNotFoundException, user_not_found_handler)
app.add_exception_handler(CustomerNotFoundException, customer_not_found_handler)
app.add_exception_handler(InactiveUserException, inactive_user_handler)
app.add_exception_handler(InactiveCustomerException, inactive_customer_handler)
app.add_exception_handler(InsufficientPermissionsException, insufficient_permissions_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

app.add_middleware(MyAuthMiddleware)

app.include_router(new_auth_router)
app.include_router(organization_plan_router)
app.include_router(customer_plan_router)
app.include_router(organization_subscription_router)
app.include_router(customer_subscription_router)
app.include_router(organization_dashboard_router)
app.include_router(organization_lookup_router)
app.include_router(organization_invoice_router)
app.include_router(customer_invoice_router)

if __name__ == "__main__": 
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
