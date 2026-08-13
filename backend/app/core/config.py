from pathlib import Path

from pydantic_settings import BaseSettings

# 실행 위치(CWD)와 무관하게 경로를 고정하기 위한 기준 디렉토리 (backend/)
# config.py 위치: backend/app/core/config.py → parents[2] = backend/
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # 업로드된 원본 h5ad 저장 경로
    storage_dir: Path = BASE_DIR / "storage"
    # 최대 업로드 크기 (bytes) — 초과 시 413 FILE_TOO_LARGE
    max_upload_size: int = 2 * 1024 * 1024 * 1024  # 2GB
    # 메타데이터 SQLite
    database_url: str = f"sqlite:///{BASE_DIR / 'insilico.db'}"
    # Leiden resolution 허용 범위
    resolution_min: float = 0.1
    resolution_max: float = 2.0

    class Config:
        env_file = ".env"


settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
