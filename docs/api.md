# API 흐름 설계

### 1. 데이터셋 업로드 및 검사

**목적:** 사용자가 `.h5ad` 파일을 업로드하고, 서버가 사용 가능한 데이터셋인지 검사합니다. 또한 파일의 메타데이터를 추출합니다.

**HTTP Method:** `POST /api/datasets` 

 **URL:** `/api/datasets`

**요청 데이터:** 업로드할 `.h5ad` 파일

**응답 데이터**

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| datasetId | String | 등록된 데이터셋 ID |
| fileName | String | 업로드한 파일명 |
| fileSize | Long | 파일 크기(KB) |
| cellCount | Integer | 세포 수 |
| geneCount | Integer | 유전자 수 |
| hasLeiden | Boolean | 기존 Leiden 결과 존재 여부 |

```json
{
	"datasetId": "ds_001",
	"fileName": "pbmc.h5ad",
	"fileSize": 24076,
	"cellCount": 2638,
	"geneCount": 1838,
	"hasLeiden": true
}
```

성공 시 `201 Created` 를 반환합니다.

**실패 조건**

| HTTP Status | 오류 코드 | 설명 |
| --- | --- | --- |
| 400 Bad Request | INVALID_FILE_FORMAT | `.h5ad` 형식이 아님 |
| 413 Payload Too Large | FILE_TOO_LARGE | 최대 허용 파일 크기 초과 |
| 422 Unprocessable Entity | DATASET_NOT_SUPPORTED | 서비스에서 요구하는 데이터 구조를 만족하지 않음 (`X_umap` 없음, 2차원 좌표 형식이 아님 또는 Neighbor Graph 없음) |
| 500 Internal Server Error | DATASET_UPLOAD_FAILED | 파일 저장 또는 메타데이터 추출 중 오류 발생 |
1. 지원하지 않는 파일 형식 (`.h5ad` 파일이 아닐 경우)

```json
{
  "code": "INVALID_FILE_FORMAT",
  "message": "지원하지 않는 파일 형식입니다. (.h5ad 파일만 업로드할 수 있습니다.)"
}
```

2. 파일 크기 초과 (2GB)

```json
{
  "code": "FILE_TOO_LARGE",
  "message": "업로드 가능한 최대 파일 크기를 초과했습니다."
}
```

3. 서비스에서 사용할 수 없는 데이터셋(`X_umap`이 없거나 2차원 좌표 형식이 아님 또는 이웃그래프가 없음)

```json
{
  "code": "DATASET_NOT_SUPPORTED",
  "message": "서비스에서 사용할 수 없는 데이터셋입니다.",
  "details": {
    "hasUmap": false,
    "hasNeighborGraph": true
  }
}
```

4. 서버 내부 오류

```json
{
  "code": "DATASET_UPLOAD_FAILED",
  "message": "데이터셋 업로드 중 오류가 발생했습니다."
}
```

### 2. UMAP 데이터 조회

**목적:**  업로드된 데이터셋의 UMAP 좌표를 조회합니다. 클러스터 정보 없이 좌표만 반환하며 화면에는 하나의 색(검은색) 으로 표시됩니다.

**HTTP Method:** `GET /api/datasets/{datasetId}/umap` 

**URL :** `/api/datasets/{datasetId}/umap`

**요청 데이터**

| 항목 | 위치 | 타입 | 설명 |
| --- | --- | --- | --- |
| `datasetId` | Path parameter | String | 조회할 데이터셋의 식별자 |

**응답 데이터**

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `datasetId` | String | 데이터셋 식별자 |
| `cellCount` | Integer | 반환된 세포 수 |
| `points` | Array | `[x, y]` 형식의 2차원 UMAP 좌표 배열. 모든 좌표는 유한한 숫자 |

```json
{
	"datasetId": "ds_001",
	"cellCount": 2638,
	"points": [
		[1.24, -0.53],
    [0.91, -0.87],
    [-2.13, 1.42],
		...
	]
}
```

```json
points[i][0] = i번째 세포의 x 좌표
points[i][1] = i번째 세포의 y 좌표
```

`points`에는 `NaN`, `Infinity`, `-Infinity`가 포함되지 않습니다.

**실패 조건**

| HTTP Status | 오류 코드 | 설명 |
| --- | --- | --- |
| 404 Not Found | DATASET_NOT_FOUND | 요청한 datasetId가 존재하지 않음   |
| 500 Internal Server Error | UMAP_LOAD_FAILED | 파일 손상, 저장 오류, 잘못된 UMAP 배열 또는 유효하지 않은 좌표가 발견됨 |
1. 데이터셋을 찾을 수 없음

```json
{
  "code": "DATASET_NOT_FOUND",
  "message": "해당 데이터셋을 찾을 수 없습니다."
}
```

2. UMAP 데이터를 불러올 수 없음

```json
{
  "code": "UMAP_LOAD_FAILED",
  "message": "UMAP 데이터를 불러오는 중 오류가 발생했습니다."
}
```

### 3. Leiden 클러스터링 실행

**목적:** 사용자가 설정한 resolution 값으로 데이터셋에 포함된 이웃그래프를 이용해 Leiden 클러스터링을 실행하고 색이 입혀진 UMAP 결과를 반환합니다.

**HTTP Method:** `POST /api/datasets/{datasetId}/analyses/clustering`

**URL:** `/api/datasets/{datasetId}/analyses/clustering`

**요청 데이터**

| 항목 | 위치 | 타입 | 설명 |
| --- | --- | --- | --- |
| `resolution` | JSON body | Float | 클러스터링 해상도(값이 클수록 세분화된 클러스터 생성) |
| `datasetId` | URL Path parameter | String | 분석할 데이터셋의 식별자 |

```json
{
  "resolution": 1.0
}
```

**응답 데이터**

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `datasetId` | String | 분석한 데이터셋 식별자 |
| `resolution` | Float | 분석에 사용한 resolution 값 |
| `clusterCount` | Integer | 생성된 클러스터 수 |
| `labels` | Array<Integer> | 각 세포의 클러스터 라벨 |

```json
{
  "datasetId": "ds_001",
  "resolution": 1.0,
  "clusterCount": 5,
  "labels": [
    0,
    0,
    2,
    1,
    4
  ]
}
```

*`labels[i]`의 값은 클러스터의 순서나 크기를 의미하지 않는 식별 번호이며  `points[i]` 에 해당하는 세포의 클러스터를 나타낸다.

**실패 조건**

| HTTP Status | 오류 코드 | 설명 |
| --- | --- | --- |
| 400 Bad Request  | INVALID_RESOLUTION | resolution 값이 허용범위를 벗어남  |
| 404 Not Found | DATASET_NOT_FOUND | 요청한 datasetId가 존재하지 않음  |
| 500 Internal Server Error | CLUSTERING_FAILED | 클러스터링 생성 중 오류 발생  |
1. resolution 값 범위 초과

```json
{
  "code": "INVALID_RESOLUTION",
  "message": "resolution 값은 0.1에서 2.0 사이여야 합니다."
}
```

2. 데이터셋 찾을 수 없음 

```json
{
  "code": "DATASET_NOT_FOUND",
  "message": "해당 데이터셋을 찾을 수 없습니다."
}
```

3. 클러스터링 실행 오류 발생
```json
{
  "code": "CLUSTERING_FAILED",
  "message": "클러스터링 실행 중 오류가 발생했습니다."
}
```
