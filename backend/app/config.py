import os
import tempfile
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

def _resolve_base_dir() -> Path:
    file_path = Path(__file__).resolve()
    # Check if repository root exists at parent.parent.parent (local repo structure)
    if (file_path.parent.parent.parent / "backend").exists():
        return file_path.parent.parent.parent
    # In Docker or standalone deployment (/app/app/config.py -> /app)
    if file_path.parent.parent.exists():
        return file_path.parent.parent
    return file_path.parent

def _register_cuda_lib_paths() -> None:
    """Register Python site-packages nvidia cublas/cudnn library paths into LD_LIBRARY_PATH."""
    try:
        import site
        site_packages = []
        if hasattr(site, "getsitepackages"):
            site_packages.extend(site.getsitepackages())
        if hasattr(site, "getusersitepackages"):
            site_packages.append(site.getusersitepackages())
        
        extra_paths: List[str] = []
        for sp in site_packages:
            p = Path(sp) / "nvidia"
            if p.is_dir():
                for sub in ("cublas", "cudnn", "cuda_runtime", "cufft", "curand"):
                    lib_dir = p / sub / "lib"
                    if lib_dir.is_dir():
                        extra_paths.append(str(lib_dir))
                        
        if extra_paths:
            curr_ld = os.environ.get("LD_LIBRARY_PATH", "")
            all_paths = extra_paths + ([curr_ld] if curr_ld else [])
            os.environ["LD_LIBRARY_PATH"] = ":".join(all_paths)
    except Exception:
        pass

_register_cuda_lib_paths()

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    BASE_DIR: Path = _resolve_base_dir()
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

    # Remote Colab GPU Worker (Hybrid Client)
    COLAB_GPU_WORKER_URL: Optional[str] = None
    COLAB_REQUEST_TIMEOUT_S: float = 180.0
    COLAB_MAX_RETRIES: int = 3

    # Defaults matching 15-schema.md
    GPU_VRAM_MB: int = 4096
    QA_MIN_GAP_MS: int = 100
    QA_MAX_CPS: float = 17.0
    QA_MIN_DURATION_S: float = 1.0
    QA_MAX_LINE_CHARS: int = 42

    @property
    def is_colab_enabled(self) -> bool:
        return bool(self.COLAB_GPU_WORKER_URL and self.COLAB_GPU_WORKER_URL.strip())

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


