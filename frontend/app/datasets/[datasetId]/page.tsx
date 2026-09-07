"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    fetchUmap,
    runClustering,
    MIN_RESOLUTION,
    MAX_RESOLUTION,
    DEFAULT_RESOLUTION,
    type UmapResponse,
    type ClusteringResult,
} from "@/lib/api/datasets";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const CLUSTER_COLORS = [
    "#9184d9",
    "#7fd1ae",
    "#e8a765",
    "#e8779a",
    "#6ab7e8",
    "#d9c25a",
    "#c47fd9",
    "#5ad9c2",
    "#e86b5a",
    "#8ad95a",
    "#d95a8a",
    "#5a7fd9",
];

const DEFAULT_POINT_COLOR = "#9184d9";

function colorForLabel(label: number): string {
    const idx = ((label % CLUSTER_COLORS.length) + CLUSTER_COLORS.length) % CLUSTER_COLORS.length;
    return CLUSTER_COLORS[idx];
}

function clampResolution(v: number): number {
    return Math.min(MAX_RESOLUTION, Math.max(MIN_RESOLUTION, v));
}

// 숫자 입력 + 알약 스텝퍼 + 트랙 위 말풍선 값이 달린 슬라이더.
// 실제 드래그/키보드 조작은 투명하게 깐 네이티브 range input이 담당하고,
// 보이는 트랙/채움/핸들/말풍선은 그 위에 얹은 시각 레이어일 뿐이다.
function ResolutionControl({
    value,
    onChange,
    disabled,
}: {
    value: number;
    onChange: (next: number) => void;
    disabled?: boolean;
}) {
    const [inputText, setInputText] = useState(value.toFixed(2));

    // 슬라이더 드래그 등 외부에서 value가 바뀌면 입력창 텍스트도 맞춘다.
    useEffect(() => {
        setInputText(value.toFixed(2));
    }, [value]);

    function commitInputText() {
        const parsed = Number(inputText);
        if (Number.isNaN(parsed)) {
            setInputText(value.toFixed(2));
            return;
        }
        const clamped = Math.round(clampResolution(parsed) * 100) / 100;
        onChange(clamped);
        setInputText(clamped.toFixed(2));
    }

    function step(delta: number) {
        const next = Math.round(clampResolution(value + delta) * 100) / 100;
        onChange(next);
    }

    const pct = ((value - MIN_RESOLUTION) / (MAX_RESOLUTION - MIN_RESOLUTION)) * 100;

    return (
        <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                Resolution
            </label>

            {/* 알약 숫자 입력 + 스텝퍼 */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#1a1a20",
                    border: "1px solid var(--color-divider)",
                    borderRadius: 999,
                    padding: "6px 8px 6px 14px",
                }}
            >
                <button
                    type="button"
                    onClick={() => step(-0.1)}
                    disabled={disabled || value <= MIN_RESOLUTION}
                    aria-label="resolution 감소"
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "none",
                        background: "transparent",
                        color: "#8b8b96",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        cursor: disabled || value <= MIN_RESOLUTION ? "not-allowed" : "pointer",
                        opacity: disabled || value <= MIN_RESOLUTION ? 0.4 : 1,
                        flexShrink: 0,
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M5 12h14" />
                    </svg>
                </button>

                <input
                    type="text"
                    inputMode="decimal"
                    value={inputText}
                    disabled={disabled}
                    onChange={(e) => setInputText(e.target.value)}
                    onBlur={commitInputText}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            commitInputText();
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                    style={{
                        width: 44,
                        background: "transparent",
                        border: "none",
                        color: "var(--color-text)",
                        fontSize: 14,
                        fontWeight: 600,
                        textAlign: "center",
                        padding: 0,
                        fontFamily: "inherit",
                    }}
                />

                <button
                    type="button"
                    onClick={() => step(0.1)}
                    disabled={disabled || value >= MAX_RESOLUTION}
                    aria-label="resolution 증가"
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "1px solid var(--color-divider)",
                        background: "transparent",
                        color: "var(--color-text)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        cursor: disabled || value >= MAX_RESOLUTION ? "not-allowed" : "pointer",
                        opacity: disabled || value >= MAX_RESOLUTION ? 0.4 : 1,
                        flexShrink: 0,
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </div>

            {/* 트랙 + 말풍선 값 + (투명) 드래그 가능한 실제 range input */}
            <div style={{ paddingTop: 30 }}>
                <div style={{ position: "relative", height: 18, display: "flex", alignItems: "center" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: 6, borderRadius: 999, background: "var(--color-divider)" }} />
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            height: 6,
                            borderRadius: 999,
                            background: "#9184d9",
                            width: `${pct}%`,
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",
                            top: -30,
                            left: `${pct}%`,
                            transform: "translateX(-50%)",
                            background: "#9184d9",
                            color: "#16151f",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 7px",
                            borderRadius: 6,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                        }}
                    >
                        {value.toFixed(2)}
                        <div
                            style={{
                                position: "absolute",
                                bottom: -3,
                                left: "50%",
                                transform: "translateX(-50%) rotate(45deg)",
                                width: 6,
                                height: 6,
                                background: "#9184d9",
                            }}
                        />
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            left: `${pct}%`,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#9184d9",
                            border: "3px solid var(--color-bg, #121218)",
                            boxShadow: "0 0 0 1px rgba(255,255,255,0.18)",
                            transform: "translateX(-50%)",
                            pointerEvents: "none",
                        }}
                    />

                    <input
                        type="range"
                        className="resolution-range-input"
                        min={MIN_RESOLUTION}
                        max={MAX_RESOLUTION}
                        step={0.1}
                        value={value}
                        disabled={disabled}
                        onChange={(e) => onChange(Number(e.target.value))}
                        style={{ position: "absolute", inset: 0, width: "100%", margin: 0 }}
                    />
                </div>

                <div className="text-muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 9 }}>
                    <span>{MIN_RESOLUTION.toFixed(1)}</span>
                    <span>{MAX_RESOLUTION.toFixed(1)}</span>
                </div>
            </div>

            {/* 네이티브 range input을 완전히 투명하게(트랙/썸 둘 다) 만들어서
                드래그 히트 영역으로만 쓰고, 보이는 트랙/핸들은 위 div들이 대신 그린다. */}
            <style jsx>{`
                .resolution-range-input {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 18px;
                    background: transparent;
                    cursor: ${disabled ? "not-allowed" : "pointer"};
                }
                .resolution-range-input::-webkit-slider-runnable-track {
                    background: transparent;
                    height: 18px;
                }
                .resolution-range-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                }
                .resolution-range-input::-moz-range-track {
                    background: transparent;
                    height: 18px;
                }
                .resolution-range-input::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                }
            `}</style>
        </div>
    );
}

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

    const [resolution, setResolution] = useState(DEFAULT_RESOLUTION);
    const [clustering, setClustering] = useState<ClusteringResult | null>(null);
    const [clusteringLoading, setClusteringLoading] = useState(false);
    const [clusteringError, setClusteringError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setClustering(null);
        setClusteringError(null);

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

    async function handleRunClustering() {
        setClusteringError(null);
        setClusteringLoading(true);

        try {
            const result = await runClustering(datasetId, resolution);
            setClustering(result);
        } catch (err: unknown) {
            setClusteringError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        } finally {
            setClusteringLoading(false);
        }
    }

    const hasMatchingLabels = clustering && umap && clustering.labels.length === umap.points.length;
    const markerColor = hasMatchingLabels ? clustering!.labels.map(colorForLabel) : DEFAULT_POINT_COLOR;
    const hoverText = hasMatchingLabels ? clustering!.labels.map((label) => `cluster ${label}`) : undefined;

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
                <aside
                    style={{
                        width: 280,
                        flexShrink: 0,
                        borderRight: "1px solid var(--color-divider)",
                        padding: "var(--space-6)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-6)",
                    }}
                >
                    <ResolutionControl
                        value={resolution}
                        onChange={setResolution}
                        disabled={!umap || clusteringLoading}
                    />

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        <button
                            type="button"
                            onClick={handleRunClustering}
                            disabled={!umap || clusteringLoading}
                            style={{
                                padding: "var(--space-3) var(--space-3)",
                                borderRadius: 8,
                                border: "1px solid var(--color-divider)",
                                background: "transparent",
                                color: "var(--color-text)",
                                fontWeight: 600,
                                cursor: !umap || clusteringLoading ? "not-allowed" : "pointer",
                                opacity: !umap ? 0.5 : 1,
                            }}
                        >
                            {clusteringLoading ? "클러스터링 실행 중..." : "클러스터링 실행"}
                        </button>

                        {clusteringError && (
                            <p style={{ color: "#d97c96", fontSize: 13, margin: 0 }}>{clusteringError}</p>
                        )}

                        {clustering && (
                            <div className="text-muted" style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
                                <div>
                                    적용된 resolution: <span style={{ color: "var(--color-text)" }}>{clustering.resolution}</span>
                                </div>
                                <div>
                                    클러스터 수: <span style={{ color: "var(--color-text)" }}>{clustering.clusterCount}</span>
                                </div>
                            </div>
                        )}
                    </div>
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
                                        color: markerColor,
                                    },
                                    text: hoverText,
                                    hoverinfo: hoverText ? "text" : "skip",
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