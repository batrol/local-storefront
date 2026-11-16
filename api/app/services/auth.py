import re
import unicodedata

from sqlalchemy.orm import Session

from app import security
from app.config import Settings
from app.db import transaction
from app.i18n import t
from app.models import AccessToken, User
from app.repositories.shops import ShopRepository
from app.repositories.users import UserRepository
from app.schemas import RegisterIn
from app.validation import ValidationFailed, rule_message


def slugify(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")


class AuthService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.users = UserRepository(db)
        self.shops = ShopRepository(db)

    def register(self, data: RegisterIn) -> tuple[User, str]:
        if self.users.email_exists(data.email):
            raise ValidationFailed.single("email", rule_message("unique", "email"))

        with transaction(self.db):
            user = self.users.create(
                data.name, data.email, security.hash_password(data.password, self.settings.bcrypt_rounds)
            )
            self.shops.create_for(user, data.shop_name, data.phone, self._unique_slug(data.shop_name))
            token = security.create_token(self.db, user)
        return user, token

    def login(self, email: str, password: str) -> tuple[User, str]:
        user = self.users.find_by_email(email)
        if user is None or not security.verify_password(password, user.password):
            raise ValidationFailed.single("email", t("Invalid credentials."))

        with transaction(self.db):
            token = security.create_token(self.db, user)
        return user, token

    def logout(self, token: AccessToken) -> None:
        with transaction(self.db):
            self.db.delete(token)

    def _unique_slug(self, name: str) -> str:
        base = slugify(name) or "shop"
        slug, i = base, 2
        while self.shops.slug_exists(slug):
            slug = f"{base}-{i}"
            i += 1
        return slug
