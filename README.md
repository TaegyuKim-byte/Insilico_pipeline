# 🧬Insilico_pipeline
코딩 없이 웹 GUI만으로 단일세포 전사체(scRNA-seq) 데이터를 분석하고 시각화하는 웹 플랫폼

> 🚧 Status: 설계 단계 (Design phase) — 문서화 완료, 구현 착수 전

## Table of Contents 

- [Purpose](#-purpose)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)


## 🎯 Purpose 

단일세포 전사체 분석 현장에는 다음과 같은 문제가 있습니다.
| # | 문제 | 대응 기능 |
|---|---|---|
| 1 | Scanpy 등 분석 도구는 Python/R 코드 작성을 전제로 해서, 프로그래밍 진입장벽 때문에 생명과학 연구자가 분석을 섣불리 시도하지 못한다 | **GUI 기반 조작** |
| 2 | 상용 GUI 분석 프로그램(Loupe Browser 등)은 대학병원·대형 기관 외 소규모 랩실이 쓰기엔 라이선스 비용이 부담스럽다 | **웹 기반 무료 플랫폼** |
| 3 | 환경 구축(Python/R 설치, 라이브러리 의존성) 자체가 별도의 진입장벽이 된다 | **설치 없는 브라우저 접근** |


## ✨ Key Features

1️⃣ 데이터 업로드 & 데이터셋 정보 확인

사용자가 .h5ad 파일을 업로드하면, 시스템이 세포 수·유전자 수 등 기본 정보와 기존 UMAP/클러스터링 결과 존재 여부를 함께 확인해 보여줍니다.

웹사이트 접속 → h5ad 업로드 → 데이터셋 정보 확인(세포 수, 유전자 수, 기존 결과 존재 여부) → 사용자에게 표시

2️⃣ UMAP 단색 표시 & 분석 여부 노출

업로드가 끝나면 클러스터링 결과 존재 여부와 관계없이 UMAP을 단색으로 먼저 보여줍니다.
색 구분은 분석을 실행해야 입혀집니다.

| 상황 | 사용자 동작 |
|---|---|
| 구조만 훑어보고 싶음 | 단색 UMAP을 그대로 탐색 |
| 클러스터별 색을 보고 싶음 | Resolution 설정 후 분석 실행 |

3️⃣ Leiden 클러스터링 & 재채색

Resolution을 설정해 분석을 실행하면 클러스터 라벨을 계산해 반환하고, UMAP을 클러스터별로 다시 색칠합니다.
UMAP 좌표 자체는 업로드된 값을 재사용하며 새로 계산하지 않습니다.

Resolution 설정 → 분석 실행 → Leiden 클러스터링 → 클러스터 라벨 반환 → UMAP 재채색

4️⃣ UMAP 인터랙티브 탐색

생성되었거나 기존에 존재하던 UMAP을 확대·축소하며 자유롭게 탐색할 수 있습니다.


## 🛠 Tech Stack

- Frontend: Next.js
- Backend: FastAPI
- 분석: Scanpy, Anndata
- 메타데이터: SQLite
- 파일 저장: Local Storage (.h5ad)

## 🗺️ Architecture 

구조, 데이터 흐름은 [docs/architecture.md](docs/architecture.md) 참고


## 📁 Project Structure

```
Insilico_pipeline/
├── backend/      # FastAPI (Dataset / Visualization / Analysis)
├── frontend/     # Next.js
├── sample-data/  # 예제 .h5ad
└── docs/         # 설계 문서 (architecture / api / workflow)
```
