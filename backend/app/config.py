import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DB_PATH: Path = BASE_DIR / "dubforge.db"
    STORAGE_DIR: Path = BASE_DIR / "storage"
    SHARED_FOLDER_PATH: Path = BASE_DIR / "shared"
    
    # Defaults matching 15-schema.md
    GPU_VRAM_MB: int = 4096
    QA_MIN_GAP_MS: int = 100
    QA_MAX_CPS: float = 17.0
    QA_MIN_DURATION_S: float = 1.0
    QA_MAX_LINE_CHARS: int = 42

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.SHARED_FOLDER_PATH.mkdir(parents=True, exist_ok=True)
