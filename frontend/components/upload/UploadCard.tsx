"use client";

import { useEffect, useRef, useState } from "react";
import {
  DatasetUploadError,
  DatasetUploadNetworkError,
  type DatasetUploadSuccess, // upload success
  uploadDataset,
  validateFileLocally,
} from "@/lib/api/datasets";

type Phase = "idle" | "uploading" | "success" | "error";

const ERROR_COLOR = "#d97c96";

function getErrorIcon(error: DatasetUploadError | DatasetUploadNetworkError) {
  if (error instanceof DatasetUploadNetworkError) {
    return (
      <svg width="56" height="56" viewBox="0 0 256 256" fill="var(--color-accent-300)" style={{ marginBottom: "var(--space-4)"}}>
        <path d="M229.66,98.34a8,8,0,0,1-11.32,11.32L200,91.31l-18.34,18.35a8,8,0,0,1-11.32-11.32L188.69,80,170.34,61.66a8,8,0,0,1,11.32-11.32L200,68.69l18.34-18.35a8,8,0,0,1,11.32,11.32L211.31,80ZM128,192a12,12,0,1,0,12,12A12,12,0,0,0,128,192Zm44.71-33.47a76.05,76.05,0,0,0-89.42,0,8,8,0,0,0,9.42,12.94,60,60,0,0,1,70.58,0,8,8,0,1,0,9.42-12.94ZM135.62,64.18a8,8,0,1,0,.76-16c-2.78-.13-5.6-.2-8.38-.2A172.35,172.35,0,0,0,18.92,87,8,8,0,1,0,29.08,99.37,156.25,156.25,0,0,1,128,64C130.53,64,133.09,64.06,135.62,64.18Zm-.16,48.07a8,8,0,1,0,1.08-16c-2.83-.19-5.7-.29-8.54-.29a122.74,122.74,0,0,0-77,26.77A8,8,0,0,0,56,137a7.93,7.93,0,0,0,5-1.73A106.87,106.87,0,0,1,128,112C130.48,112,133,112.08,135.46,112.25Z"></path>
      </svg>
    );
  }

  // DatasetUploadError인 경우, code별로 분기
  switch (error.code) {
    case "INVALID_FILE_FORMAT":
      return (
        <svg width="56" height="56" viewBox="0 0 256 256" fill="var(--color-accent-300)" style={{ marginBottom: "var(--space-4)"}}>
          <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-42.34-82.34L139.31,152l18.35,18.34a8,8,0,0,1-11.32,11.32L128,163.31l-18.34,18.35a8,8,0,0,1-11.32-11.32L116.69,152,98.34,133.66a8,8,0,0,1,11.32-11.32L128,140.69l18.34-18.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      );
    case "FILE_TOO_LARGE":
      return (
        <svg width="56" height="56" viewBox="0 0 256 256" fill="var(--color-accent-300)"style={{ marginBottom: "var(--space-4)"}} >
          <path d="M207.06,72.67A111.24,111.24,0,0,0,128,40h-.4C66.07,40.21,16,91,16,153.13V176a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V152A111.25,111.25,0,0,0,207.06,72.67ZM224,176H119.71l54.76-75.3a8,8,0,0,0-12.94-9.42L99.92,176H32V153.13c0-3.08.15-6.12.43-9.13H56a8,8,0,0,0,0-16H35.27c10.32-38.86,44-68.24,84.73-71.66V80a8,8,0,0,0,16,0V56.33A96.14,96.14,0,0,1,221,128H200a8,8,0,0,0,0,16h23.67c.21,2.65.33,5.31.33,8Z"></path>
        </svg>
      );
    case "DATASET_NOT_SUPPORTED":
      return (
        <svg width="56" height="56" viewBox="0 0 256 256" fill="var(--color-accent-300)"style={{ marginBottom: "var(--space-4)"}}>
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path>
        </svg>
      );
    case "DATASET_UPLOAD_FAILED":
      return (
        <svg width="56" height="56" viewBox="0 0 256 256" fill="var(--color-accent-300)" style={{ marginBottom: "var(--space-4)"}}>
         <path d="M229.66,98.34a8,8,0,0,1-11.32,11.32L200,91.31l-18.34,18.35a8,8,0,0,1-11.32-11.32L188.69,80,170.34,61.66a8,8,0,0,1,11.32-11.32L200,68.69l18.34-18.35a8,8,0,0,1,11.32,11.32L211.31,80ZM128,192a12,12,0,1,0,12,12A12,12,0,0,0,128,192Zm44.71-33.47a76.05,76.05,0,0,0-89.42,0,8,8,0,0,0,9.42,12.94,60,60,0,0,1,70.58,0,8,8,0,1,0,9.42-12.94ZM135.62,64.18a8,8,0,1,0,.76-16c-2.78-.13-5.6-.2-8.38-.2A172.35,172.35,0,0,0,18.92,87,8,8,0,1,0,29.08,99.37,156.25,156.25,0,0,1,128,64C130.53,64,133.09,64.06,135.62,64.18Zm-.16,48.07a8,8,0,1,0,1.08-16c-2.83-.19-5.7-.29-8.54-.29a122.74,122.74,0,0,0-77,26.77A8,8,0,0,0,56,137a7.93,7.93,0,0,0,5-1.73A106.87,106.87,0,0,1,128,112C130.48,112,133,112.08,135.46,112.25Z"></path>
        </svg>
      );
  }
}

export default function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<DatasetUploadError | DatasetUploadNetworkError | null>(null);
  const [success, setSuccess] = useState<DatasetUploadSuccess | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Abort whatever's in flight if the card unmounts mid-upload.
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // A drop that misses the zone (e.g. lands on the page background) would
  // otherwise make the browser navigate away to open the file directly.
  useEffect(() => {
    function preventDefault(e: DragEvent) {
      e.preventDefault();
    }
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);
    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  function submit(fileToUpload: File) {
    setFile(fileToUpload);
    setPhase("uploading");
    setProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    uploadDataset(fileToUpload, setProgress, controller.signal)
      .then((data) => {
        setSuccess(data);
        setPhase("success");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          setPhase("idle");
          return;
        }
        setError(
          err instanceof DatasetUploadError || err instanceof DatasetUploadNetworkError
            ? err
            : new DatasetUploadNetworkError(),
        );
        setPhase("error");
      })
      .finally(() => {
        abortControllerRef.current = null;
      });
  }

  function acceptFile(candidate: File | undefined | null) {
    if (!candidate) return;
    const localError = validateFileLocally(candidate);
    if (localError) {
      setFile(candidate);
      setError(localError);
      setPhase("error");
      return;
    }
    submit(candidate);
  }

  function reset() { //for another file upload 
    setPhase("idle");
    setFile(null);
    setError(null);
    setSuccess(null);
    setProgress(0);
  }

  function cancelUpload() {
    abortControllerRef.current?.abort();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0]);
    e.target.value = ""; // allow re-selecting the same file later
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDraggingOver(true);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDraggingOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="card elev-sm" style={{ width: 500, padding: "var(--space-8)" }}>
      {phase === "idle" && (
        <>
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
              border: `1px dashed ${isDraggingOver ? "var(--color-accent)" : "var(--color-neutral-700)"}`,
              borderRadius: "var(--radius-md)",
              padding: "var(--space-8) var(--space-8)",
              textAlign: "center",
              background: isDraggingOver
                ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                : "transparent",
              transition: "border-color 120ms ease, background-color 120ms ease",
            }}
          >
           <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="var(--color-accent-300)" viewBox="0 0 256 256">
           <path d="M178.34,165.66,160,147.31V208a8,8,0,0,1-16,0V147.31l-18.34,18.35a8,8,0,0,1-11.32-11.32l32-32a8,8,0,0,1,11.32,0l32,32a8,8,0,0,1-11.32,11.32ZM160,40A88.08,88.08,0,0,0,81.29,88.68,64,64,0,1,0,72,216h40a8,8,0,0,0,0-16H72a48,48,0,0,1,0-96c1.1,0,2.2,0,3.29.12A88,88,0,0,0,72,128a8,8,0,0,0,16,0,72,72,0,1,1,100.8,66,8,8,0,0,0,3.2,15.34,7.9,7.9,0,0,0,3.2-.68A88,88,0,0,0,160,40Z"></path>
           </svg>
            <div className="card-title" style={{ margin: 0 }}>
              .h5ad 파일을 드래그하거나 선택하세요
            </div>
            <p className="card-body" style={{ margin: 0 }}>
              AnnData 객체(.h5ad)만 업로드할 수 있습니다.
              <br />
              전처리(PCA), Neighbor Graph, UMAP 계산이 완료된 파일이어야 합니다.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{marginTop: "var(--space-1)"}}
              onClick={() => inputRef.current?.click()}
            >
              파일 선택
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".h5ad"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
          <p className="text-muted" style={{ fontSize: 12, marginTop: "var(--space-4)", textAlign: "center" }}>
            최대 파일 크기 2GB · 지원 형식 .h5ad (AnnData)
          </p>
        </>
      )}

      {phase === "uploading" && file && (
        <div>
          <div className="card-title" style={{ margin: 0 }}>
            업로드 중...
          </div>
          <p className="text-muted" style={{ fontSize: 13, margin: "var(--space-1) 0 var(--space-3)" }}>
            {file.name}
          </p>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "var(--color-neutral-800)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--color-accent-500)",
                transition: "width 150ms ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "var(--space-3)",
            }}
          >
            <span className="text-muted" style={{ fontSize: 12 }}>
              {progress}%
            </span>
            <button type="button" className="btn btn-secondary" onClick={cancelUpload}>
              취소
            </button>
          </div>
        </div>
      )}

      {phase === "success" && success && (
        <div>
          <div className="card-title" style={{ margin: 0 }}>
            데이터셋 업로드 완료
          </div>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              rowGap: 6,
              columnGap: 12,
              fontSize: 13,
              margin: "var(--space-3) 0 var(--space-4)",
            }}
          >
            <dt className="text-muted">데이터셋 ID</dt>
            <dd style={{ margin: 0 }}>{success.datasetId}</dd>
            <dt className="text-muted">파일명</dt>
            <dd style={{ margin: 0 }}>{success.fileName}</dd>
            <dt className="text-muted">파일 크기</dt>
            <dd style={{ margin: 0 }}>{success.fileSize.toLocaleString("ko-KR")} KB</dd>
            <dt className="text-muted">세포 수</dt>
            <dd style={{ margin: 0 }}>{success.cellCount.toLocaleString("ko-KR")}</dd>
            <dt className="text-muted">유전자 수</dt>
            <dd style={{ margin: 0 }}>{success.geneCount.toLocaleString("ko-KR")}</dd>
            <dt className="text-muted">기존 Leiden 결과</dt>
            <dd style={{ margin: 0 }}>{success.hasLeiden ? "있음" : "없음"}</dd>
          </dl>
          <button type="button" className="btn btn-secondary" onClick={reset}>
            다른 파일 업로드
          </button>
        </div>
      )}

      {phase === "error" && error && (
        <div style={{textAlign: "center"}}>
         {getErrorIcon(error)}
          <div className="card-title" style={{ margin: 0, color: ERROR_COLOR }}>
            {error.message.split("(")[0].trim()}
          </div>
          {error.message.includes("(") && (
            <p className = "text-muted" style = {{ fontSize: 14 , margin: "var(--space-2) 0 0 "}}>
              {error.message.split("(")[1]?.replace(")","")}
            </p>
          )}
          {error instanceof DatasetUploadError && error.details && (
            <div style={{ display: "flex", gap: 6, marginTop: "var(--space-2)" ,justifyContent: "center"}}>
              <span className="tag tag-neutral">hasUmap: {String(error.details.hasUmap)}</span>
              <span className="tag tag-neutral">
                hasNeighborGraph: {String(error.details.hasNeighborGraph)}
              </span>
            </div>
          )}
          {file && (
            <p className="text-muted" style={{ fontSize: 12, margin: "var(--space-2) 0 0" }}>
              선택한 파일: {file.name}
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" ,justifyContent: "center"}}>
            {file &&
              (error instanceof DatasetUploadNetworkError ||
                (error instanceof DatasetUploadError && error.code === "DATASET_UPLOAD_FAILED")) && (
                <button type="button" className="btn btn-primary" onClick={() => submit(file)}>
                  다시 시도
                </button>
              )}
            <button type="button" className="btn btn-secondary" onClick={reset}>
              다른 파일 선택
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
