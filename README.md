# 🧬Insilico_pipeline
코딩 없이 웹 GUI만으로 단일세포 전사체(scRNA-seq) 데이터를 분석하고 시각화하는 웹 플랫폼

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

2️⃣ 기존 결과 재사용 또는 신규 분석 설정

기존 분석 결과가 있는지에 따라 사용자 경험이 갈라집니다.

상황	사용자 동작
기존 UMAP/클러스터링 결과가 있음	바로 UMAP을 탐색
결과가 없거나 새 기준으로 재분석하고 싶음	클러스터링 해상도(Resolution)를 설정
3️⃣ 클러스터링 + UMAP 생성

사용자가 UMAP 생성 버튼을 누르면, 시스템이 설정된 Resolution으로 클러스터링과 UMAP 계산을 수행합니다.

Resolution 설정 → UMAP 생성 클릭 → Leiden 클러스터링 실행 → UMAP 좌표 계산 → 결과 반환

4️⃣ UMAP 인터랙티브 탐색

생성되었거나 기존에 존재하던 UMAP을 확대·축소하며 자유롭게 탐색할 수 있습니다.


## 🛠 Tech Stack

## 🗺️ Architecture 

## 📁 Project Structure

## :busts_in_silhouette: Team

| 역할 | 담당 |
|---|---|
| Frontend | Minseo Kim |
| Backend | Taekyu Kim |