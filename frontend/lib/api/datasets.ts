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

// The request never reached the server (offline, CORS, server down, DNS...).
// Distinct from DatasetUploadError because no documented error code applies.
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

// Checks the two conditions the client can rule out without a round trip.
// FILE_TOO_LARGE and INVALID_FILE_FORMAT can therefore surface instantly;
// DATASET_NOT_SUPPORTED and DATASET_UPLOAD_FAILED can only come from the server.
export function validateFileLocally(file: File): DatasetUploadError | null {
  if (!file.name.toLowerCase().endsWith(".h5ad")) {
    return new DatasetUploadError("INVALID_FILE_FORMAT", DOC_ERROR_MESSAGES.INVALID_FILE_FORMAT);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return new DatasetUploadError("FILE_TOO_LARGE", DOC_ERROR_MESSAGES.FILE_TOO_LARGE);
  }
  return null;
}

// NOTE: the backend for this endpoint lives on a teammate's branch and isn't
// merged here yet, so the multipart field name ("file") and base URL are our
// best guess from docs/api.md — confirm both once the branches are combined.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// Uses XMLHttpRequest (not fetch) because it's the only API with upload
// progress events, and h5ad files can be large enough (up to ~2GB) that
// progress feedback matters.
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
