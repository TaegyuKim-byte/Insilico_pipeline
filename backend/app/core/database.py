from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite + FastAPI 멀티스레드
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI 의존성 주입용 DB 세션 (Spring의 @Autowired 세션과 유사)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
