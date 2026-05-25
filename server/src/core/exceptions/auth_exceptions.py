"""Authentication related exception types.

Defines exceptions used when validating and decoding JWTs and auth
headers. These are lightweight exception classes carrying message and
optional details used by middleware and handlers.
"""


class AuthBaseException(Exception):
    """Base for all auth-related exceptions."""
    def __init__(self, message: str, details: str = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class InvalidToken(AuthBaseException):
    def __init__(self, details: str = None):
        super().__init__(message="Invalid or expired token", details=details)


class InvalidAuthorizationFormat(AuthBaseException):
    def __init__(self, details: str = None):
        super().__init__(message="Invalid authorization header format", details=details)


class GeneralException(AuthBaseException):
    def __init__(self, details: str = None):
        super().__init__(message="An unexpected error occurred", details=details)

class InvalidPasswordException(AuthBaseException):
    def __init__(self, details: str = None):
        super().__init__(
            message="Invalid password",
            details=details or (
                "Password must be at least 8 characters long "
                "and contain at least 1 special character."
            )
        )