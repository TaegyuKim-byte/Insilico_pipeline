"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchUmap, type UmapResponse } from "@/lib/api/datasets";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const MIN_RESOLUTION = 0.1;
const MAX_RESOLUTION = 2.0;
const DEFAULT_RESOLUTION = 1.0;

export default function DatasetPage({
    params,
}: {
    params: Promise<{ datasetId: string }>;
}) {
    const { datasetId } = use(params);
    const router = useRouter();

    const [umap, setUmap] = useState<UmapResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Sidebar state only for now — not wired to the clustering API yet.
    const [resolution, setResolution] = useState(DEFAULT_RESOLUTION);

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetchUmap(datasetId)
            .then((data) => {
                setUmap(data);
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [datasetId]);

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-4) var(--space-6)",
                    borderBottom: "1px solid var(--color-divider)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text)" }}
                    >
                        ←
                    </button>
                    <span className="text-muted" style={{ fontSize: 12 }}>
                        {datasetId}
                    </span>
                </div>
            </header>

            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                {/* 왼쪽 사이드바 — 지금은 레이아웃 + resolution 슬라이더 UI만. API 연결은 다음 단계에서. */}
                <aside
                    style={{
                        width: 280,
                        flexShrink: 0,
                        borderRight: "1px solid var(--color-divider)",
                        padding: "var(--space-6)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-5)",
                    }}
                >
                    <div>
                        <label
                            htmlFor="resolution-slider"
                            style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: "var(--space-2)" }}
                        >
                            Resolution
                        </label>
                        <input
                            id="resolution-slider"
                            type="range"
                            min={MIN_RESOLUTION}
                            max={MAX_RESOLUTION}
                            step={0.1}
                            value={resolution}
                            onChange={(e) => setResolution(Number(e.target.value))}
                            style={{ width: "100%" }}
                        />
                        <div
                            className="text-muted"
                            style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: "var(--space-1)" }}
                        >
                            <span>{MIN_RESOLUTION.toFixed(1)}</span>
                            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{resolution.toFixed(1)}</span>
                            <span>{MAX_RESOLUTION.toFixed(1)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => console.log("클러스터링 실행 (resolution:", resolution, ") — API 연결 예정")}
                        style={{
                            padding: "var(--space-3) var(--space-3)",
                            borderRadius: 8,
                            border: "1px solid var(--color-divider)",
                            background: "transparent",
                            color: "var(--color-text)",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        클러스터링 실행
                    </button>
                </aside>

                <div style={{ flex: 1, padding: "var(--space-6)" }}>
                    {loading && <p className="text-muted">UMAP 데이터를 불러오는 중...</p>}
                    {error && <p style={{ color: "#d97c96" }}>{error}</p>}
                    {umap && (
                        <Plot
                            data={[
                                {
                                    x: umap.points.map((p) => p[0]),
                                    y: umap.points.map((p) => p[1]),
                                    type: "scattergl",
                                    mode: "markers",
                                    marker: {
                                        size: 4,
                                        color: "#9184d9",
                                    },
                                },
                            ]}
                            layout={{
                                paper_bgcolor: "transparent",
                                plot_bgcolor: "transparent",
                                font: { color: "#e9e9ed" },
                                xaxis: { showgrid: false, zeroline: false },
                                yaxis: { showgrid: false, zeroline: false },
                                margin: { l: 40, r: 20, t: 20, b: 40 },
                            }}
                            style={{ width: "100%", height: "600px" }}
                            config={{ responsive: true }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}