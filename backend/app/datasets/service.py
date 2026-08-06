"""데이터셋 업로드/검증/저장 로직.

TODO(구현): 파일 형식·크기 검증 → AnnData 로드 → X/obs/var + UMAP/Neighbor Graph 검증
            → 저장 + 메타 등록 → datasetId 반환. 실패 시 app.core.errors.APIError 발생.
"""

import shutil
import os
import anndata as ad
from uuid import uuid4

from app.core.config import settings
from app.core.errors import APIError
from app.datasets.schemas import DatasetUploadResponse
from app.datasets.models import Dataset

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


def create_dataset(file, db: Session) -> DatasetUploadResponse:
    # 파일 형식 검증
    if not file.filename.endswith(".h5ad"):
        raise APIError(400, "INVALID_FILE_FORMAT", "지원하지 않는 파일 형식입니다. (.h5ad 파일만 업로드할 수 있습니다.)")

    # 파일 크기 검증 (내용을 읽지 않고 끝 위치로 크기만 확인)
    file.file.seek(0, os.SEEK_END)   # 파일 끝으로 이동
    file_size = file.file.tell()     # 현재 위치 = 총 바이트 크기
    file.file.seek(0)                # 이후 저장/검증을 위해 처음으로 되돌림

    if file_size > settings.max_upload_size:
        raise APIError(
            413,
            "FILE_TOO_LARGE",
            "업로드 가능한 최대 파일 크기를 초과했습니다.",
        )
    
    dataset_id = f"ds_{uuid4().hex[:8]}" # 무작위 고유 ID 생성

    # 파일 저장 (크기 제한 체크)
    file_path = settings.storage_dir / f"{dataset_id}.h5ad" # 처리 완료
    temporary_path = settings.storage_dir / f"{dataset_id}.h5ad.part" # 처리 중

    adata = None

    try:
        # 임시 파일 저장
        with temporary_path.open("wb") as output:
            shutil.copyfileobj(
                file.file,
                output,
                length=1024 * 1024,
            )

        # AnnData 로드
        try:
            adata = ad.read_h5ad(
                temporary_path,
                backed="r", # 읽기 전용 모드
            )
        except Exception as exc:
            raise APIError(
                400,
                "INVALID_FILE_FORMAT",
                "올바른 .h5ad 파일이 아닙니다.",
            ) from exc

        # 메타데이터 추출 및 구조 확인
        try:
            has_umap = (
                "X_umap" in adata.obsm
                and adata.obsm["X_umap"].shape == (adata.n_obs, 2)
            )
            has_graph = (
                "connectivities" in adata.obsp
                and adata.obsp["connectivities"].shape 
                == (adata.n_obs, adata.n_obs)
            )

            cell_count = adata.n_obs
            gene_count = adata.n_vars
            has_leiden = "leiden" in adata.obs.columns
        finally:
            if adata is not None and adata.isbacked:
                adata.file.close()

        if not (has_umap and has_graph):
            raise APIError(
                422,
                "DATASET_NOT_SUPPORTED",
                "서비스에서 사용할 수 없는 데이터셋입니다.",
                {
                    "hasUmap": has_umap,
                    "hasNeighborGraph": has_graph
                },
            )

        # 검증 완료 후 최종 파일로 변경
        temporary_path.replace(file_path)

    except APIError:
        temporary_path.unlink(missing_ok=True)
        raise

    except Exception as exc:
        temporary_path.unlink(missing_ok=True)
        raise APIError(
            500,
            "DATASET_UPLOAD_FAILED",
            "데이터셋 업로드 중 오류가 발생했습니다.",
        ) from exc

    # DB에 메타데이터 등록
    dataset = Dataset(
        dataset_id=dataset_id,
        file_name=file.filename,
        file_path=str(file_path),
        file_size=file_size,
        cell_count=cell_count,
        gene_count=gene_count,
        has_leiden=has_leiden,
    )

    try:
        db.add(dataset)
        db.commit()

    except SQLAlchemyError as exc:
        db.rollback()
        file_path.unlink(missing_ok=True)

        raise APIError(
            500,
            "DATASET_UPLOAD_FAILED",
            "데이터셋 메타데이터 등록 중 오류가 발생했습니다.",
        ) from exc

    return DatasetUploadResponse(
        datasetId=dataset_id, 
        fileName=file.filename,
        fileSize=(file_size + 1023) // 1024,
        cellCount=cell_count,
        geneCount=gene_count,
        hasLeiden=has_leiden,
    )
