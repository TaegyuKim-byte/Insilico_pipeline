from fastapi import APIRouter, UploadFile, status

from app.datasets import service
from app.datasets.schemas import DatasetUploadResponse

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.post("", response_model=DatasetUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_dataset(file: UploadFile):
    """`.h5ad` 업로드 및 검사 (api.md §1)."""
    return service.create_dataset(file)
