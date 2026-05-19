# src/core/exceptions/handlers.py

from fastapi import Request
from fastapi.responses import JSONResponse

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


async def invalid_token_handler(request: Request, exc: InvalidToken):
    return JSONResponse(
        status_code=401,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def invalid_authorization_format_handler(request: Request, exc: InvalidAuthorizationFormat):
    return JSONResponse(
        status_code=401,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def general_exception_handler(request: Request, exc: GeneralException):
    return JSONResponse(
        status_code=500,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


# --- Service handlers ---

async def user_already_exists_handler(request: Request, exc: UserAlreadyExistsException):
    return JSONResponse(
        status_code=409,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def customer_already_exists_handler(request: Request, exc: CustomerAlreadyExistsException):
    return JSONResponse(
        status_code=409,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def organization_already_exists_handler(request: Request, exc: OrganizationAlreadyExistsException):
    return JSONResponse(
        status_code=409,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def invalid_credentials_handler(request: Request, exc: InvalidCredentialsException):
    return JSONResponse(
        status_code=401,
        content={"detail": exc.message}
    )


async def user_not_found_handler(request: Request, exc: UserNotFoundException):
    return JSONResponse(
        status_code=404,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def inactive_user_handler(request: Request, exc: InactiveUserException):
    return JSONResponse(
        status_code=403,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def inactive_customer_handler(request: Request, exc: InactiveCustomerException):
    return JSONResponse(
        status_code=403,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )


async def insufficient_permissions_handler(request: Request, exc: InsufficientPermissionsException):
    return JSONResponse(
        status_code=403,
        content={"detail": exc.message}
    )


async def customer_not_found_handler(request: Request, exc: CustomerNotFoundException):
    return JSONResponse(
        status_code=404,
        content={
            "detail": exc.message,
            **({"info": exc.details} if exc.details else {})
        }
    )
