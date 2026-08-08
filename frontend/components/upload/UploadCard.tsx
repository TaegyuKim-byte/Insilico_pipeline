"use client";

import { useEffect, useRef, useState } from "react";

const ACCEPTED_EXTENSION = ".h5ad";

// Mirrors the INVALID_FILE_FORMAT (400) message from docs/api.md so the
// client-side guard reads identically to the server's eventual response.
const INVALID_FILE_FORMAT_MESSAGE =
  "지원하지 않는 파일 형식입니다. (.h5ad 파일만 업로드할 수 있습니다.)";

export default function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rejectedFile, setRejectedFile] = useState<string | null>(null);

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

  function acceptFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION)) {
      setRejectedFile(file.name);
      setSelectedFile(null);
      return;
    }
    setRejectedFile(null);
    setSelectedFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0]);
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
    <div className="card elev-sm" style={{ maxWidth: 640, padding: "var(--space-6)" }}>
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
          padding: "var(--space-8) var(--space-6)",
          textAlign: "center",
          background: isDraggingOver
            ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
            : "transparent",
          transition: "border-color 120ms ease, background-color 120ms ease",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 256 256" fill="var(--color-accent-300)">
          <path d="M224,144v64a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V144a8,8,0,0,1,16,0v64H208V144a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V152a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z" />
        </svg>
        <div className="card-title" style={{ margin: 0 }}>
          .h5ad 파일을 드래그하거나 선택하세요
        </div>
        <p className="card-body" style={{ margin: 0 }}>
          AnnData 객체(.h5ad)만 업로드할 수 있습니다. 전처리(PCA), Neighbor Graph, UMAP 계산이
          완료된 파일이어야 합니다.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
          파일 선택
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".h5ad"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {selectedFile && (
          <p className="text-muted" style={{ margin: 0, fontSize: 12 }}>
            선택한 파일: {selectedFile.name}
          </p>
        )}
        {rejectedFile && (
          <p style={{ margin: 0, fontSize: 12, color: "#d97c96" }}>
            {INVALID_FILE_FORMAT_MESSAGE}
            <br />
            <span className="text-muted">선택한 파일: {rejectedFile}</span>
          </p>
        )}
      </div>
      <p className="text-muted" style={{ fontSize: 12, marginTop: "var(--space-4)" }}>
        최대 파일 크기 2GB · 지원 형식 .h5ad (AnnData)
      </p>
    </div>
  );
}
