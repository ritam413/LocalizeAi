import os
import tempfile
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DB_PATH: Path = BASE_DIR / "dubforge.db"
    STORAGE_DIR: Path = BASE_DIR / "storage"
    SHARED_FOLDER_PATH: Path = BASE_DIR / "shared"
    
    # Server & Environment
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "production"
    CORS_ORIGINS: str = "*"

    # Core AI Reasoning
    GEMINI_API_KEY: str = ""
    LLM_PROVIDER: str = "ollama"  # "ollama" or "gemini"
    OLLAMA_BASE_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"

    # Defaults matching 15-schema.md
    GPU_VRAM_MB: int = 4096
    QA_MIN_GAP_MS: int = 100
    QA_MAX_CPS: float = 17.0
    QA_MIN_DURATION_S: float = 1.0
    QA_MAX_LINE_CHARS: int = 42

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.SHARED_FOLDER_PATH.mkdir(parents=True, exist_ok=True)

# Ensure temp and model cache directories exist on STORAGE_DIR (D:\ drive)
temp_dir = settings.STORAGE_DIR / "tmp"
temp_dir.mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "models" / "torch").mkdir(parents=True, exist_ok=True)
(settings.STORAGE_DIR / "models" / "huggingface").mkdir(parents=True, exist_ok=True)

# Enforce tempfile to use storage/tmp
tempfile.tempdir = str(temp_dir)
os.environ["TMPDIR"] = str(temp_dir)
os.environ["TEMP"] = str(temp_dir)
os.environ["TMP"] = str(temp_dir)


