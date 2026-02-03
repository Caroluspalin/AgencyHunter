# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agency Hunter API"
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/agency_hunter"
    SECRET_KEY: str = "MUUTA_TAMÄ_TUOTANNOSSA_ERITTÄIN_SALAISEKSI"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()