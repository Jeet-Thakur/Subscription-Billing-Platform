
class ServiceBaseException(Exception):
    def __init__(self, message: str, details: str = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class UserAlreadyExistsException(ServiceBaseException):
    def __init__(self, identifier: str):
        super().__init__(
            message="User already exists",
            details=f"User '{identifier}' is already registered"
        )


class CustomerAlreadyExistsException(ServiceBaseException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Customer already exists",
            details=f"Customer '{identifier}' is already registered"
        )


class OrganizationAlreadyExistsException(ServiceBaseException):
    def __init__(self, slug: str):
        super().__init__(
            message="Organization already exists",
            details=f"Organization '{slug}' is already registered"
        )


class InvalidCredentialsException(ServiceBaseException):
    def __init__(self):
        super().__init__(message="Invalid credentials")


class InactiveUserException(ServiceBaseException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Inactive user",
            details=f"User '{identifier}' is inactive"
        )


class InactiveCustomerException(ServiceBaseException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Inactive customer",
            details=f"Customer '{identifier}' is inactive"
        )


class InsufficientPermissionsException(ServiceBaseException):
    def __init__(self):
        super().__init__(message="Insufficient permissions")


class UserNotFoundException(ServiceBaseException):
    def __init__(self, identifier: str = None):
        super().__init__(
            message="User not found",
            details=f"User '{identifier}' does not exist" if identifier else None
        )


class CustomerNotFoundException(ServiceBaseException):
    def __init__(self, identifier: str = None):
        super().__init__(
            message="Customer not found",
            details=f"Customer '{identifier}' does not exist" if identifier else None
        )
