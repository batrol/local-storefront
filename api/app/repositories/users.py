from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, name: str, email: str, password_hash: str) -> User:
        user = User(name=name, email=email, password=password_hash)
        self.db.add(user)
        self.db.flush()
        return user

    def find_by_email(self, email: str) -> User | None:
        return self.db.scalars(select(User).options(joinedload(User.shop)).where(User.email == email)).first()

    def email_exists(self, email: str) -> bool:
        return self.db.scalars(select(User.id).where(User.email == email)).first() is not None
