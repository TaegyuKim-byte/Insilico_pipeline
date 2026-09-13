import hashlib
from unittest.mock import Mock

import anndata as ad
import numpy as np
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from scipy.sparse import csr_matrix
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.analyses import service
from app.analyses.router import router
from app.core.database import Base, get_db
from app.core.errors import APIError, api_error_handler
from app.datasets.models import Dataset
from app.visualization.router import router as umap_router


@pytest.fixture
def setup(tmp_path):
    path = tmp_path / "dataset.h5ad"
    adata = ad.AnnData(np.zeros((6, 2)))
    groups = np.arange(6) % 2
    graph = (groups[:, None] == groups[None, :]).astype(float)
    np.fill_diagonal(graph, 0)
    adata.obsp["connectivities"] = csr_matrix(graph)
    adata.obsm["X_umap"] = np.arange(12, dtype=float).reshape(6, 2)
    adata.obs["leiden"] = ["original"] * 6
    adata.write_h5ad(path)

    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        dataset = Dataset(
            dataset_id="ds_test", file_name="original.h5ad", file_path=str(path),
            file_size=path.stat().st_size, cell_count=6, gene_count=2, has_leiden=True,
        )
        db.add(dataset)
        db.commit()

        app = FastAPI()
        app.add_exception_handler(APIError, api_error_handler)
        app.include_router(router)
        app.include_router(umap_router)
        app.dependency_overrides[get_db] = lambda: db
        with TestClient(app) as client:
            yield client, db, path
    engine.dispose()


URL = "/api/datasets/ds_test/analyses/clustering"


@pytest.mark.parametrize("resolution", [0.1, 1.0, 2.0])
def test_real_clustering_response_and_original_unchanged(setup, resolution):
    client, _, path = setup
    digest = hashlib.sha256(path.read_bytes()).digest()
    umap = client.get("/api/datasets/ds_test/umap").json()
    response = client.post(URL, json={"resolution": resolution})
    assert response.status_code == 200
    result = response.json()
    assert set(result) == {"datasetId", "resolution", "clusterCount", "labels"}
    assert result["datasetId"] == "ds_test"
    assert result["resolution"] == resolution
    labels = result["labels"]
    assert len(labels) == len(umap["points"]) == 6
    assert all(type(label) is int for label in labels)
    assert result["clusterCount"] == len(set(labels)) == 2
    # Interleaved disconnected components must map to the original cell order.
    assert labels[0] == labels[2] == labels[4]
    assert labels[1] == labels[3] == labels[5]
    assert labels[0] != labels[1]
    assert hashlib.sha256(path.read_bytes()).digest() == digest


@pytest.mark.parametrize("resolution", [-1, 0, 0.09, 2.01, 100, "NaN", "Infinity"])
def test_invalid_resolution(setup, resolution):
    response = setup[0].post(URL, json={"resolution": resolution})
    assert response.status_code == 400
    assert response.json() == {
        "code": "INVALID_RESOLUTION",
        "message": "resolution 값은 0.1에서 2.0 사이여야 합니다.",
    }


def test_missing_dataset(setup):
    response = setup[0].post(
        "/api/datasets/missing/analyses/clustering", json={"resolution": 1.0}
    )
    assert response.status_code == 404
    assert response.json() == {
        "code": "DATASET_NOT_FOUND", "message": "해당 데이터셋을 찾을 수 없습니다."
    }


@pytest.mark.parametrize("failure", ["db", "file", "graph", "leiden", "labels"])
def test_server_errors_are_sanitized(setup, monkeypatch, failure):
    client, db, path = setup
    if failure == "db":
        monkeypatch.setattr(db, "get", Mock(side_effect=SQLAlchemyError("private")))
    elif failure == "file":
        dataset = db.get(Dataset, "ds_test")
        dataset.file_path = str(path.parent / "missing.h5ad")
        db.commit()
    elif failure == "graph":
        adata = ad.read_h5ad(path)
        del adata.obsp["connectivities"]
        adata.write_h5ad(path)
    elif failure == "leiden":
        monkeypatch.setattr(service.sc.tl, "leiden", Mock(side_effect=RuntimeError("private")))
    else:
        def invalid_labels(adata, **kwargs):
            adata.obs["leiden"] = [None] * adata.n_obs
        monkeypatch.setattr(service.sc.tl, "leiden", invalid_labels)
    response = client.post(URL, json={"resolution": 1.0})
    assert response.status_code == 500
    assert response.json() == {
        "code": "CLUSTERING_FAILED", "message": "클러스터링 실행 중 오류가 발생했습니다."
    }
