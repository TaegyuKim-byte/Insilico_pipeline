"use client";

import { useRef, useState } from "react";

export default function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  return (
    <div className="card elev-sm" style={{ maxWidth: 640, padding: "var(--space-6)" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-3)",
          border: "1px dashed var(--color-neutral-700)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-8) var(--space-6)",
          textAlign: "center",
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
      </div>
      <p className="text-muted" style={{ fontSize: 12, marginTop: "var(--space-4)" }}>
        최대 파일 크기 2GB · 지원 형식 .h5ad (AnnData)
      </p>
    </div>
  );
}
