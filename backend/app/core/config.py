from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "TransitOps API"
    SECRET_KEY: str = "dev_secret_key_change_in_prod"
    ALGORITHM: str = "HS256"
    # Guide spec: 8–12 hours for demo; no refresh tokens needed
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # Database — default matches docker-compose.yml
    DATABASE_URL: str = "postgresql://transitops:transitops_dev@localhost:5432/transitops"

    # CORS — tighten to real frontend origin once deployed
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
