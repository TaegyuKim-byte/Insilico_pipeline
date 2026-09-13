"""기존 Neighbor Graph를 이용한 Leiden 클러스터링."""

import logging
import math

import anndata as ad
import scanpy as sc
from sqlalchemy.orm import Session

from app.analyses.schemas import ClusteringResponse
from app.core.config import settings
from app.core.errors import APIError
from app.datasets.models import Dataset

logger = logging.getLogger(__name__)

def run_clustering(
    dataset_id: str, resolution: float, db: Session
) -> ClusteringResponse:
    stage = "resolution 검증"
    try:
        if not math.isfinite(resolution) or not (
            # settings에 설정된 값들로 범위 체크
            settings.resolution_min <= resolution <= settings.resolution_max
        ):
            raise APIError(
                400,
                "INVALID_RESOLUTION",
                f"resolution 값은 {settings.resolution_min}에서 "
                f"{settings.resolution_max} 사이여야 합니다.",
            )

        stage = "데이터셋 조회"
        dataset = db.get(Dataset, dataset_id)
        if dataset is None:
            raise APIError(
                404, "DATASET_NOT_FOUND", "해당 데이터셋을 찾을 수 없습니다."
            )

        stage = "파일 로드 및 그래프 검증"
        # 메모리에서만 분석하며 원본 파일에는 결과를 저장하지 않는다.
        adata = ad.read_h5ad(dataset.file_path)
        graph = adata.obsp["connectivities"]
        if adata.n_obs == 0 or graph.shape != (adata.n_obs, adata.n_obs):
            raise ValueError("Invalid neighbor graph or empty dataset")

        stage = "Leiden 실행"
        # 업로드 시 검증한 그래프를 직접 사용한다. neighbors 메타데이터는 불필요하다.
        sc.tl.leiden(
            adata,
            resolution=resolution,
            adjacency=graph,
            key_added="leiden",
            flavor="leidenalg",
            random_state=0,
        )

        stage = "결과 검증"
        labels = adata.obs["leiden"].astype(int).tolist()
        if len(labels) != adata.n_obs or any(label < 0 for label in labels):
            raise ValueError("Invalid cluster labels")

        return ClusteringResponse(
            datasetId=dataset.dataset_id,
            resolution=resolution,
            clusterCount=len(set(labels)),
            labels=labels,
        )
    except APIError:
        raise
    except Exception as exc:
        logger.exception(
            "클러스터링 실패. dataset_id=%s stage=%s", dataset_id, stage
        )
        raise APIError(
            500, "CLUSTERING_FAILED", "클러스터링 실행 중 오류가 발생했습니다."
        ) from exc
