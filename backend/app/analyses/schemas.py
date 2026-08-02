from pydantic import BaseModel


class ClusteringRequest(BaseModel):
    """POST .../analyses/clustering 요청 (api.md §3)."""

    resolution: float


class ClusteringResponse(BaseModel):
    """클러스터링 응답 (api.md §3).

    labels[i] = points[i] 세포의 클러스터 식별 번호(순서/크기 의미 없음).
    UMAP 좌표는 재계산하지 않고 기존 값을 재사용한다.
    """

    datasetId: str
    resolution: float
    clusterCount: int
    labels: list[int]
