from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.analyses import service
from app.analyses.schemas import ClusteringRequest, ClusteringResponse
from app.core.database import get_db

router = APIRouter(prefix="/api/datasets", tags=["analyses"])


@router.post("/{dataset_id}/analyses/clustering", response_model=ClusteringResponse)
def run_clustering(
    dataset_id: str, body: ClusteringRequest, db: Session = Depends(get_db)
):
    """Leiden 클러스터링 실행 (api.md §3)."""
    return service.run_clustering(dataset_id, body.resolution, db)
