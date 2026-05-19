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
