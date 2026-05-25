"""Simple login request schema.

Used for both user and customer login endpoints.
"""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str