# 🧬Insilico_pipeline
코딩 없이 웹 GUI만으로 단일세포 전사체(scRNA-seq) 데이터를 클러스터링하고 시각화하는 웹 플랫폼

> 🚧 Status: 설계 단계 (Design phase) — 문서화 완료, 구현 착수 전

## Table of Contents 

- [Purpose](#-purpose)
- [Key Features](#-key-features)
- [How To Use](#-how-to-use)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Team](#-team)


## 🎯 Purpose 

단일세포 전사체 분석 현장에는 다음과 같은 문제가 있습니다.
| # | 문제 | 대응 기능 |
|---|---|---|
| 1 | Scanpy 등 분석 도구는 Python/R 코드 작성을 전제로 해서, 프로그래밍 진입장벽 때문에 생명과학 연구자가 분석을 섣불리 시도하지 못한다 | **GUI 기반 조작** |
| 2 | 상용 GUI 분석 프로그램(Loupe Browser 등)은 대학병원·대형 기관 외 소규모 랩실이 쓰기엔 라이선스 비용이 부담스럽다 | **웹 기반 무료 플랫폼** |
| 3 | 환경 구축(Python/R 설치, 라이브러리 의존성) 자체가 별도의 진입장벽이 된다 | **설치 없는 브라우저 접근** |


## ✨ Key Features

1️⃣ 데이터 업로드 & 데이터셋 검증 

사용자가 `.h5ad` 파일을 업로드하면, 시스템이 파일 형식과 데이터 구조(`X`, `obs`, `var`, UMAP 좌표, Neighbor Graph)를 검증한 뒤 등록합니다.

h5ad 업로드 → 파일 형식/구조 검증 → 데이터셋 등록(datasetId 발급) → 세포 수·유전자 수·기존 Leiden 결과 존재 여부 반환

<<<<<<< HEAD
2️⃣ UMAP 조회(기존 좌표 시각화)

등록된 데이터셋에 저장되어 있던 UMAP 좌표를 그대로 불러와 보여줍니다. 별도 클러스터링 전에는 단색으로 표시됩니다.

datasetId로 UMAP 조회 요청 → 저장된 UMAP 좌표 반환 → 클라이언트 렌더링

3️⃣ Resolution 설정 & Leiden 클러스터링 실행

사용자가 클러스터링 해상도(Resolution)를 설정하고 실행하면, 시스템은 데이터셋에 포함된 기존 Neighbor Graph를 이용해 Leiden 클러스터링을 수행합니다.

Resolution 설정 → 클러스터링 실행 클릭 → 기존 Neighbor Graph 기반 Leiden 실행 → 클러스터 라벨 반환 → 기존 UMAP 좌표 위에 색상 반영 
=======
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
>>>>>>> 58a79e9e3b46611369c88f8b7f9e6815f8a36b5e

4️⃣ UMAP 인터랙티브 탐색

클러스터링 결과가 반영된 UMAP을 확대,축소,이동하며 자유롭게 탐색하고 특정 클러스터를 클릭해 하이라이트할 수 있습니다. 

## 🥸 How To Use 

## 🛠 Tech Stack

<<<<<<< HEAD
| 영역 | 기술 |
|---|---|
| Frontend | Next.js |
| Backend | FastAPI |
| Analysis | Scanpy (Leiden Clustering) |
| Metadata Storage | SQLite |
| File Storage | h5ad 파일 시스템 저장 |

## 🗺️ Architecture 

 Next.js Client
      │
      ▼
 FastAPI Server
 ┌───────────────────┬───────────┬────────────────┐
 │ Dataset Management │  Analysis │  Visualization  │
 └───────────────────┴───────────┴────────────────┘
      │                    │              │
      ▼                    ▼              ▼
   SQLite            h5ad Storage    h5ad Storage
 (메타데이터)         (원본 파일 로드)  (UMAP 좌표 로드)

 - Dataset Management: .h5ad 업로드 검증 → 원본 파일 저장 → 메타데이터 등록 → datasetId 반환
 - Visualization: datasetId로 저장된 .h5ad에서 UMAP 좌표를 읽어 반환
 - Analysis: datasetId와 resolution으로 기존 Neighbor Graph 기반 Leiden 클러스터링 수행 후 라벨 반환

## 📁 Project Structure

insilico-pipeline/
├── frontend/          # Next.js
├── backend/           # FastAPI
├── docs/              # 설계 문서
├── sample-data/       # 테스트용 .h5ad
├── .gitignore
├── README.md

## :busts_in_silhouette: Team

| 역할 | 담당 |
|---|---|
| Frontend | Minseo Kim |
| Backend | Taekyu Kim |
=======
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
>>>>>>> 58a79e9e3b46611369c88f8b7f9e6815f8a36b5e
