from fastapi import APIRouter

from app.analyses import service
from app.analyses.schemas import ClusteringRequest, ClusteringResponse

router = APIRouter(prefix="/api/datasets", tags=["analyses"])


@router.post("/{dataset_id}/analyses/clustering", response_model=ClusteringResponse)
async def run_clustering(dataset_id: str, body: ClusteringRequest):
    """Leiden 클러스터링 실행 (api.md §3)."""
    return service.run_clustering(dataset_id, body.resolution)
