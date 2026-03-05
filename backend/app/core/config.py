from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]  # -> backend/
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_PATH), extra="ignore")

    DATABASE_URL: str
    JWT_SECRET: str = "pOGSXnKA_zgj72hEzlMiEXgmNYooWL2FtjnfGALNmmY"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_MINUTES: int = 30

settings = Settings()