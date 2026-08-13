"""UMAP 좌표 조회 로직.

MVP: 저장된 h5ad에서 obsm["X_umap"] 좌표를 읽어 반환.
향후: 유전자 발현 색칠, 다른 임베딩(t-SNE/PCA) 등 서버 측 시각화 데이터 가공으로 확장.

TODO(구현): datasetId로 메타 조회(없으면 404 DATASET_NOT_FOUND) → h5ad 로드
            → X_umap 좌표 반환. 로드 실패 시 500 UMAP_LOAD_FAIL.
"""

from app.visualization.schemas import UmapResponse


def get_umap(dataset_id: str) -> UmapResponse:
    # 스캐폴딩: api.md 예시 형태의 더미 좌표
    return UmapResponse(
        datasetId=dataset_id,
        cellCount=3,
        points=[[1.24, -0.53], [0.91, -0.87], [-2.13, 1.42]],
    )
