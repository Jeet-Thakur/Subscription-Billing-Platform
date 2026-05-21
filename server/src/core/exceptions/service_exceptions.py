
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


class OrganizationNotFoundException(ServiceBaseException):
    def __init__(self, identifier: str = None):
        super().__init__(
            message="Organization not found",
            details=f"Organization '{identifier}' does not exist" if identifier else None
        )


class InvoiceNotFoundException(ServiceBaseException):
    def __init__(self, identifier: str = None):
        super().__init__(
            message="Invoice not found",
            details=f"Invoice '{identifier}' does not exist" if identifier else None
        )


class PlanNotFoundException(ServiceBaseException):
    def __init__(self, identifier: str = None):
        super().__init__(
            message="Plan not found",
            details=f"Plan '{identifier}' does not exist" if identifier else None
        )


class SubscriptionNotFoundException(ServiceBaseException):
    def __init__(self, identifier: str = None):
        super().__init__(
            message="Subscription not found",
            details=f"Subscription '{identifier}' does not exist" if identifier else None
        )


class SubscriptionAlreadyExistsException(ServiceBaseException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Subscription already exists",
            details=f"Subscription for plan '{identifier}' is already active"
        )


class ActiveSubscriptionsExistException(ServiceBaseException):
    def __init__(self, identifier: str):
        super().__init__(
            message="Active subscriptions exist",
            details=f"Plan '{identifier}' still has active subscriptions"
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
