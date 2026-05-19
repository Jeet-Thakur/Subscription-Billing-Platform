# Standard library imports
# Third-party imports
# Local application imports

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.exceptions.auth_exceptions import InvalidToken, InvalidAuthorizationFormat, GeneralException
from src.core.exceptions.service_exceptions import (
    CustomerAlreadyExistsException,
    CustomerNotFoundException,
    InactiveCustomerException,
    InactiveUserException,
    InsufficientPermissionsException,
    InvalidCredentialsException,
    OrganizationAlreadyExistsException,
    UserAlreadyExistsException,
    UserNotFoundException,
)
from src.core.exceptions.handlers import (
    customer_already_exists_handler,
    customer_not_found_handler,
    inactive_customer_handler,
    inactive_user_handler,
    insufficient_permissions_handler,
    invalid_token_handler,
    invalid_authorization_format_handler,
    general_exception_handler,
    user_already_exists_handler,
    organization_already_exists_handler,
    invalid_credentials_handler,
    user_not_found_handler,
)
from src.config.settings import settings
from src.api.middleware.my_auth_middleware import MyAuthMiddleware
from src.api.rest.routes.new_auth_route import router as new_auth_router
from src.api.rest.routes.websocket_route import router as websocket_router
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
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.add_middleware(MyAuthMiddleware)

app.include_router(new_auth_router)
app.include_router(websocket_router)

if __name__ == "__main__": 
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
