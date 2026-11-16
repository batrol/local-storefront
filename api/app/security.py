import hashlib
import hmac
import secrets

import bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import AccessToken, User


def hash_password(password: str, rounds: int) -> str:
    # bcrypt only looks at the first 72 bytes
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt(rounds)).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode()[:72], hashed.encode())


def _digest(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def create_token(db: Session, user: User, name: str = "web") -> str:
    """Store a hashed token for the user and return the plain text `<id>|<secret>` once."""
    secret = secrets.token_urlsafe(32)
    row = AccessToken(user_id=user.id, name=name, token=_digest(secret))
    db.add(row)
    db.flush()
    return f"{row.id}|{secret}"


def find_token(db: Session, plain: str) -> AccessToken | None:
    token_id, _, secret = plain.partition("|")
    if not token_id.isdigit() or not secret:
        return None
    row = db.scalars(
        select(AccessToken)
        .options(joinedload(AccessToken.user).joinedload(User.shop))
        .where(AccessToken.id == int(token_id))
    ).first()
    if row is None or not hmac.compare_digest(row.token, _digest(secret)):
        return None
    return row
