"""JWT helper for creating and validating access tokens.

Encapsulates creation and decoding of JWT access tokens used for
authentication, centralizing secret and algorithm usage from settings.
"""

from datetime import UTC, datetime, timedelta

from jose import ExpiredSignatureError, JWTError, jwt

from src.config.settings import settings
from src.core.exceptions.auth_exceptions import InvalidToken


class JWTProvider:

    def create_access_token(
        self,
        subject: str,
        expires_delta: timedelta = timedelta(hours=1),
        extra_claims: dict | None = None
    ) -> str:
        payload = {
            "sub": subject,
            "exp": datetime.now(UTC) + expires_delta,
        }

        if extra_claims:
            payload.update(extra_claims)

        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def decode_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except ExpiredSignatureError:
            raise InvalidToken(details="Token has expired")
        except JWTError:
            raise InvalidToken(details="Token is malformed or invalid")

        # Validity checks after decode
        sub = payload.get("sub")
        if not sub:
            raise InvalidToken(details="Token is missing subject claim")

        exp = payload.get("exp")
        if not exp:
            raise InvalidToken(details="Token is missing expiration claim")

        return payload
