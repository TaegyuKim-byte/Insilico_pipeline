from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.analyses.router import router as analyses_router
from app.datasets.router import router as datasets_router
from app.visualization.router import router as visualization_router
from app.datasets import models  # noqa: F401  (테이블 등록용 import)
from app.core.database import Base, engine
from app.core.errors import APIError, api_error_handler

app = FastAPI(title="Insilico Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # 허용할 주소들
        "http://localhost:3000",
    ],
    allow_credentials=False, # 현재 쿠키 기반 로그인 요청 X. 비활성화
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# 공통 에러 핸들러 (api.md 포맷 {code, message, details})
app.add_exception_handler(APIError, api_error_handler)

# 라우터 수동 등록 (Spring의 컴포넌트 스캔이 없어 명시적으로 붙임)
app.include_router(datasets_router)
app.include_router(visualization_router)
app.include_router(analyses_router)


@app.on_event("startup")
def on_startup():
    # 스캐폴딩: 메타데이터 테이블 생성 (추후 Alembic 마이그레이션으로 교체 가능)
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
