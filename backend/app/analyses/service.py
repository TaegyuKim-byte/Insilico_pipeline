"""Leiden 클러스터링 로직.

TODO(구현): datasetId 존재 확인(없으면 404) → resolution 범위 검증(벗어나면 400)
            → h5ad 로드 → 기존 Neighbor Graph로 sc.tl.leiden 실행
            → labels/clusterCount 반환. MVP는 전처리·Neighbor Graph·UMAP 재계산 안 함.
"""

from app.analyses.schemas import ClusteringResponse


def run_clustering(dataset_id: str, resolution: float) -> ClusteringResponse:
    # 스캐폴딩: api.md 예시 형태의 더미 라벨
    labels = [0, 0, 2, 1, 4]
    return ClusteringResponse(
        datasetId=dataset_id,
        resolution=resolution,
        clusterCount=len(set(labels)),
        labels=labels,
    )
