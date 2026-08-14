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
    <div className="card elev-sm" style={{ maxWidth: 800, padding: "var(--space-8)" }}>
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
        <div>
          <div className="card-title" style={{ margin: 0, color: ERROR_COLOR }}>
            업로드할 수 없습니다
          </div>
          <p style={{ fontSize: 13, margin: "var(--space-2) 0 0" }}>{error.message}</p>
          {error instanceof DatasetUploadError && error.details && (
            <div style={{ display: "flex", gap: 6, marginTop: "var(--space-2)" }}>
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
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
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
