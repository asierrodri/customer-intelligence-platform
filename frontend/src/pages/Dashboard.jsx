import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import {
    getDashboardSummary,
    getDashboardDistribution,
    getDashboardTop,
    getFeatureImportance
} from "../api/client";

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [top, setTop] = useState([]);
    const [loading, setLoading] = useState(true);

    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const [features, setFeatures] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        async function loadDashboard() {
            try {
                const [
                    summaryData,
                    distributionData,
                    topData,
                    featureData
                ] = await Promise.all([
                    getDashboardSummary(token),
                    getDashboardDistribution(token),
                    getDashboardTop(token),
                    getFeatureImportance(token)
                ]);

                setSummary(summaryData);
                setTop(topData);
                renderChart(distributionData);
                setFeatures(featureData);
                renderFeatureChart(featureData);
            } catch (error) {
                console.error("Dashboard load error:", error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();

        const handleResize = () => {
            chartInstanceRef.current?.resize();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (chartInstanceRef.current) {
                chartInstanceRef.current.dispose();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    function renderChart(data) {
        if (!chartRef.current) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.dispose();
        }

        const chart = echarts.init(chartRef.current);
        chartInstanceRef.current = chart;

        chart.setOption({
            tooltip: {
                trigger: "axis"
            },
            grid: {
                left: 40,
                right: 20,
                top: 40,
                bottom: 40
            },
            xAxis: {
                type: "category",
                data: data.map((item) => item.risk_level),
                axisLine: {
                    lineStyle: {
                        color: "#999"
                    }
                }
            },
            yAxis: {
                type: "value",
                axisLine: {
                    show: false
                },
                splitLine: {
                    lineStyle: {
                        color: "#eee"
                    }
                }
            },
            series: [
                {
                    name: "Customers",
                    type: "bar",
                    barWidth: "45%",
                    data: data.map((item) => item.total),
                    itemStyle: {
                        borderRadius: [8, 8, 0, 0]
                    },
                    label: {
                        show: true,
                        position: "top"
                    }
                }
            ]
        });
    }

    function renderFeatureChart(data) {

        const el = document.getElementById("feature-chart");

        if (!el) return;

        const chart = echarts.init(el);

        chart.setOption({

            tooltip: { trigger: "axis" },

            grid: {
                left: 120,
                right: 30,
                top: 20,
                bottom: 20
            },

            xAxis: {
                type: "value"
            },

            yAxis: {
                type: "category",
                data: data.map(f => formatFeatureName(f.feature)).reverse()
            },

            series: [
                {
                    type: "bar",
                    data: data.map(f => f.importance).reverse()
                }
            ]

        });
    }

    function formatPercent(value) {
        return `${(Number(value) * 100).toFixed(1)}%`;
    }

    function getRiskBadgeStyle(riskLevel) {
        const baseStyle = {
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 600,
            display: "inline-block"
        };

        if (riskLevel === "high") {
            return {
                ...baseStyle,
                backgroundColor: "#fee2e2",
                color: "#b91c1c"
            };
        }

        if (riskLevel === "medium") {
            return {
                ...baseStyle,
                backgroundColor: "#fef3c7",
                color: "#b45309"
            };
        }

        return {
            ...baseStyle,
            backgroundColor: "#dcfce7",
            color: "#15803d"
        };
    }

    function formatFeatureName(name) {
        return name
            .replace(/^num__/, "")
            .replace(/^cat__/, "")
            .replace(/_/g, " ");
    }

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
                <h2 style={{ marginBottom: 16 }}>Customer Intelligence Dashboard</h2>
                <p>Cargando dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: "32px" }}>Customer Intelligence Dashboard</h1>
                <p style={{ color: "#666", marginTop: 8 }}>
                    Vista analítica del riesgo de churn de clientes
                </p>
            </div>

            {summary && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "16px",
                        marginBottom: "24px"
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "20px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                        }}
                    >
                        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                            Average churn probability
                        </p>
                        <h2 style={{ margin: "10px 0 0", fontSize: "32px" }}>
                            {formatPercent(summary.avg_churn_probability)}
                        </h2>
                    </div>

                    <div
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "20px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                        }}
                    >
                        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                            High risk customers
                        </p>
                        <h2 style={{ margin: "10px 0 0", fontSize: "32px" }}>
                            {Number(summary.high_risk_customers).toLocaleString()}
                        </h2>
                    </div>

                    <div
                        style={{
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "20px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                        }}
                    >
                        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                            Customers scored
                        </p>
                        <h2 style={{ margin: "10px 0 0", fontSize: "32px" }}>
                            {Number(summary.customers_scored).toLocaleString()}
                        </h2>
                    </div>
                </div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    alignItems: "stretch",
                    marginBottom: "24px"
                }}
            >
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Risk distribution</h3>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                            Clientes agrupados por nivel de riesgo
                        </p>
                    </div>

                    <div ref={chartRef} style={{ height: 360 }} />
                </div>

                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Feature importance</h3>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                            Variables más influyentes del modelo
                        </p>
                    </div>

                    <div id="feature-chart" style={{ height: 360 }} />
                </div>
            </div>

            <div
                style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "20px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Top churn risk customers</h3>
                    <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                        Ranking de clientes con mayor probabilidad de churn
                    </p>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "14px"
                        }}
                    >
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                                <th style={{ padding: "12px 8px" }}>Customer</th>
                                <th style={{ padding: "12px 8px" }}>Probability</th>
                                <th style={{ padding: "12px 8px" }}>Risk</th>
                                <th style={{ padding: "12px 8px" }}>Tenure</th>
                                <th style={{ padding: "12px 8px" }}>Charges</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top.map((customer) => (
                                <tr
                                    key={customer.customer_key}
                                    style={{ borderBottom: "1px solid #f0f0f0" }}
                                >
                                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>
                                        {customer.customer_key}
                                    </td>
                                    <td style={{ padding: "12px 8px" }}>
                                        {formatPercent(customer.churn_proba)}
                                    </td>
                                    <td style={{ padding: "12px 8px" }}>
                                        <span style={getRiskBadgeStyle(customer.risk_level)}>
                                            {customer.risk_level}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px 8px" }}>{customer.tenure}</td>
                                    <td style={{ padding: "12px 8px" }}>
                                        ${Number(customer.monthly_charges).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}