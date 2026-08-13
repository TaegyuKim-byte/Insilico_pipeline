from pydantic import BaseModel


class DatasetUploadResponse(BaseModel):
    """POST /api/datasets 응답 (api.md §1)."""

    datasetId: str
    fileName: str
    fileSize: int  # KB
    cellCount: int
    geneCount: int
    hasLeiden: bool
