from fastapi import APIRouter

from app.visualization import service
from app.visualization.schemas import UmapResponse

# URL은 datasets 하위지만, 시각화 책임이라 별도 도메인 모듈에서 관리.
router = APIRouter(prefix="/api/datasets", tags=["visualization"])


@router.get("/{dataset_id}/umap", response_model=UmapResponse)
async def get_umap(dataset_id: str):
    """UMAP 좌표 조회 (api.md §2)."""
    return service.get_umap(dataset_id)
