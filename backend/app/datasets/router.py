from fastapi import APIRouter, Depends, UploadFile, status
from sqlalchemy.orm import Session


from app.core.database import get_db
from app.datasets import service
from app.datasets.schemas import DatasetUploadResponse

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.post("", response_model=DatasetUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_dataset(
    file: UploadFile,
    db: Session = Depends(get_db),
):
    """`.h5ad` 업로드 및 검사 (api.md §1)."""
    return service.create_dataset(file, db)
