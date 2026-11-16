from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Local Storefront"
    app_env: str = "local"
    app_locale: str = "en"
    database_url: str = "sqlite:///./storefront.sqlite"
    bcrypt_rounds: int = 12
    order_rate_limit: int = 30
