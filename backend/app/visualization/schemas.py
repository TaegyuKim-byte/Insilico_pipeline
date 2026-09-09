from pydantic import BaseModel


class UmapResponse(BaseModel):
    """GET /api/datasets/{datasetId}/umap 응답 (api.md §2).

    points[i] = [x, y] — i번째 세포의 UMAP 좌표. 클러스터 정보 없이 좌표만 반환(단색).
    """

    datasetId: str
    fileName: str
    cellCount: int
    geneCount: int
    points: list[list[float]]
