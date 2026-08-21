"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchUmap, type UmapResponse } from "@/lib/api/datasets";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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
        <div>
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


            <div style={{ padding: "var(--space-6)" }}>
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
    );
}