// Client for POST /api/datasets — see docs/api.md "1. 데이터셋 업로드 및 검사".



export type DatasetUploadSuccess = {
  datasetId: string;
  fileName: string;
  fileSize: number;
  cellCount: number;
  geneCount: number;
  hasLeiden: boolean;
};

export type DatasetErrorCode =
  | "INVALID_FILE_FORMAT"
  | "FILE_TOO_LARGE"
  | "DATASET_NOT_SUPPORTED"
  | "DATASET_UPLOAD_FAILED";

export type DatasetNotSupportedDetails = {
  hasUmap: boolean;
  hasNeighborGraph: boolean;
};

const ERROR_CODES: readonly DatasetErrorCode[] = [
  "INVALID_FILE_FORMAT",
  "FILE_TOO_LARGE",
  "DATASET_NOT_SUPPORTED",
  "DATASET_UPLOAD_FAILED",
];

function isDatasetErrorCode(value: unknown): value is DatasetErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

// Thrown for any documented 4xx/5xx response from POST /api/datasets.
export class DatasetUploadError extends Error {
  code: DatasetErrorCode;
  details?: DatasetNotSupportedDetails;

  constructor(code: DatasetErrorCode, message: string, details?: DatasetNotSupportedDetails) {
    super(message);
    this.name = "DatasetUploadError";
    this.code = code;
    this.details = details;
  }
}


export class DatasetUploadNetworkError extends Error {
  constructor() {
    super("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    this.name = "DatasetUploadNetworkError";
  }
}

export const MAX_FILE_SIZE_BYTES = 2 * 1024 ** 3; // 2GB, matches the limit shown in UploadCard

export const DOC_ERROR_MESSAGES = {
  INVALID_FILE_FORMAT: "지원하지 않는 파일 형식입니다. (.h5ad 파일만 업로드할 수 있습니다.)",
  FILE_TOO_LARGE: "업로드 가능한 최대 파일 크기를 초과했습니다.",
} as const satisfies Partial<Record<DatasetErrorCode, string>>;


export function validateFileLocally(file: File): DatasetUploadError | null {
  if (!file.name.toLowerCase().endsWith(".h5ad")) {
    return new DatasetUploadError("INVALID_FILE_FORMAT", DOC_ERROR_MESSAGES.INVALID_FILE_FORMAT);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return new DatasetUploadError("FILE_TOO_LARGE", DOC_ERROR_MESSAGES.FILE_TOO_LARGE);
  }
  return null;
}


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";


export function uploadDataset(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<DatasetUploadSuccess> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/datasets`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onerror = () => reject(new DatasetUploadNetworkError());
    // abort() fires "abort", not "error" or "load" — without this handler a
    // cancelled upload would leave the promise pending forever.
    xhr.onabort = () => reject(new DOMException("업로드가 취소되었습니다.", "AbortError"));

    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        // fall through with body === null
      }

      if (xhr.status === 201 && body) {
        resolve(body as DatasetUploadSuccess);
        return;
      }

      const parsed = body as { code?: unknown; message?: unknown; details?: DatasetNotSupportedDetails } | null;
      const code = isDatasetErrorCode(parsed?.code) ? parsed.code : "DATASET_UPLOAD_FAILED";
      const message =
        typeof parsed?.message === "string"
          ? parsed.message
          : "데이터셋 업로드 중 오류가 발생했습니다.";
      reject(new DatasetUploadError(code, message, parsed?.details));
    };

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("업로드가 취소되었습니다.", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort());
    }

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export type UmapResponse = {
  datasetId: string;
  cellCount: number;
  points: [number, number][];
};

export async function fetchUmap(datasetId: string): Promise<UmapResponse> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${datasetId}/umap`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("해당 데이터셋을 찾을 수 없습니다.");
    }
    throw new Error("UMAP 데이터를 불러오는 중 오류가 발생했습니다.");
  }

  return res.json();
}

// Client for POST /api/datasets/{datasetId}/analyses/clustering
// — see docs/api.md "3. Leiden 클러스터링 실행".

export type ClusteringResult = {
  datasetId: string;
  resolution: number;
  clusterCount: number;
  labels: number[];
};

export type ClusteringErrorCode = "INVALID_RESOLUTION" | "DATASET_NOT_FOUND" | "CLUSTERING_FAILED";

const CLUSTERING_ERROR_CODES: readonly ClusteringErrorCode[] = [
  "INVALID_RESOLUTION",
  "DATASET_NOT_FOUND",
  "CLUSTERING_FAILED",
];

function isClusteringErrorCode(value: unknown): value is ClusteringErrorCode {
  return typeof value === "string" && (CLUSTERING_ERROR_CODES as readonly string[]).includes(value);
}

export class ClusteringError extends Error {
  code: ClusteringErrorCode;

  constructor(code: ClusteringErrorCode, message: string) {
    super(message);
    this.name = "ClusteringError";
    this.code = code;
  }
}

export const MIN_RESOLUTION = 0.1;
export const MAX_RESOLUTION = 2.0;
export const DEFAULT_RESOLUTION = 1.0;

export async function runClustering(datasetId: string, resolution: number): Promise<ClusteringResult> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${datasetId}/analyses/clustering`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution }),
  });

  if (res.ok) {
    return res.json();
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // fall through with body === null
  }

  const parsed = body as { code?: unknown; message?: unknown } | null;
  const code = isClusteringErrorCode(parsed?.code) ? parsed.code : "CLUSTERING_FAILED";
  const message =
    typeof parsed?.message === "string" ? parsed.message : "클러스터링 실행 중 오류가 발생했습니다.";
  throw new ClusteringError(code, message);
}