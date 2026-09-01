"""UMAP 좌표 조회 로직."""

import logging

import anndata as ad
import numpy as np
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.errors import APIError
from app.datasets.models import Dataset
from app.visualization.schemas import UmapResponse

logger = logging.getLogger(__name__)


def get_umap(dataset_id: str, db: Session) -> UmapResponse:
    try:
        dataset = db.get(Dataset, dataset_id)
    except SQLAlchemyError as exc:
        logger.exception(
            "데이터셋 DB 조회 실패. dataset_id=%s",
            dataset_id,
        )
        raise APIError(
            500,
            "UMAP_LOAD_FAILED",
            "UMAP 데이터를 불러오는 중 오류가 발생했습니다.",
        ) from exc

    if dataset is None:
        raise APIError(
            404,
            "DATASET_NOT_FOUND",
            "해당 데이터셋을 찾을 수 없습니다.",
        )

    adata = None

    try:
        adata = ad.read_h5ad(dataset.file_path, backed="r")
        coordinates = adata.obsm["X_umap"]

        # UMAP 좌표가 2차원이 아닌 경우
        if coordinates.shape != (adata.n_obs, 2):
            raise ValueError("X_umap must contain two coordinates per cell")

        if not np.isfinite(coordinates).all():
            raise ValueError("X_umap contains NaN or Infinity")

        points = coordinates.tolist()
    except Exception as exc:
        logger.exception(
            "존재하는 데이터셋의 UMAP 데이터를 불러오지 못했습니다. dataset_id=%s",
            dataset_id,
        )
        raise APIError(
            500,
            "UMAP_LOAD_FAILED",
            "UMAP 데이터를 불러오는 중 오류가 발생했습니다.",
        ) from exc
    finally:
        if adata is not None and adata.isbacked:
            adata.file.close()

    return UmapResponse(
        datasetId=dataset.dataset_id,
        cellCount=len(points),
        points=points,
    )
