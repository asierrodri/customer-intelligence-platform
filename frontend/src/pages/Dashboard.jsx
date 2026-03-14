import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import {
    getDashboardSummary,
    getDashboardDistribution,
    getDashboardTop,
    getFeatureImportance,
    getChurnByContract,
    getChurnByTenure,
    getHighValueRisk
} from "../api/client";

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [top, setTop] = useState([]);
    const [distribution, setDistribution] = useState([]);
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [highValueRisk, setHighValueRisk] = useState([]);

    const riskChartRef = useRef(null);
    const featureChartRef = useRef(null);

    const riskChartInstanceRef = useRef(null);
    const featureChartInstanceRef = useRef(null);

    const [contractData, setContractData] = useState([]);
    const [tenureData, setTenureData] = useState([]);

    const contractChartRef = useRef(null);
    const tenureChartRef = useRef(null);

    const contractChartInstanceRef = useRef(null);
    const tenureChartInstanceRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        async function loadDashboard() {
            try {
                const [
                    summaryData,
                    distributionData,
                    topData,
                    featureData,
                    contractDataRes,
                    tenureDataRes,
                    highValueRiskData
                ] = await Promise.all([
                    getDashboardSummary(token),
                    getDashboardDistribution(token),
                    getDashboardTop(token),
                    getFeatureImportance(token),
                    getChurnByContract(token),
                    getChurnByTenure(token),
                    getHighValueRisk(token)
                ]);

                setSummary(summaryData);
                setTop(topData);
                setDistribution(distributionData);
                setFeatures(featureData);
                setContractData(contractDataRes);
                setTenureData(tenureDataRes);
                setHighValueRisk(highValueRiskData);
            } catch (error) {
                console.error("Dashboard load error:", error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    useEffect(() => {
        if (loading) return;
        renderRiskChart();
        renderFeatureChart();
        renderContractChart();
        renderTenureChart();

        const handleResize = () => {
            riskChartInstanceRef.current?.resize();
            featureChartInstanceRef.current?.resize();
            contractChartInstanceRef.current?.resize();
            tenureChartInstanceRef.current?.resize();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);

            if (riskChartInstanceRef.current) {
                riskChartInstanceRef.current.dispose();
                riskChartInstanceRef.current = null;
            }

            if (featureChartInstanceRef.current) {
                featureChartInstanceRef.current.dispose();
                featureChartInstanceRef.current = null;
            }
        };
    }, [loading, distribution, features, contractData, tenureData]);

    function renderRiskChart() {
        if (!riskChartRef.current || !distribution.length) return;

        if (riskChartInstanceRef.current) {
            riskChartInstanceRef.current.dispose();
        }

        const chart = echarts.init(riskChartRef.current);
        riskChartInstanceRef.current = chart;

        chart.setOption({
            tooltip: {
                trigger: "axis"
            },
            grid: {
                left: 40,
                right: 20,
                top: 30,
                bottom: 40
            },
            xAxis: {
                type: "category",
                data: distribution.map((item) => item.risk_level)
            },
            yAxis: {
                type: "value"
            },
            series: [
                {
                    name: "Customers",
                    type: "bar",
                    barWidth: "45%",
                    data: distribution.map((item, i) => ({
                        value: item.total,
                        itemStyle: {
                            color:
                                item.risk_level === "high"
                                    ? "#ef4444"
                                    : item.risk_level === "medium"
                                        ? "#f59e0b"
                                        : "#22c55e"
                        }
                    })),
                }
            ]
        });
    }

    function renderFeatureChart() {
        if (!featureChartRef.current || !features.length) return;

        if (featureChartInstanceRef.current) {
            featureChartInstanceRef.current.dispose();
        }

        const chart = echarts.init(featureChartRef.current);
        featureChartInstanceRef.current = chart;

        const sortedFeatures = [...features].sort(
            (a, b) => b.importance - a.importance
        );

        chart.setOption({
            tooltip: {
                trigger: "axis"
            },
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
                data: sortedFeatures.map((f) => formatFeatureName(f.feature)).reverse()
            },
            series: [
                {
                    type: "bar",
                    data: sortedFeatures.map((f) => f.importance).reverse()
                }
            ]
        });
    }

    function formatPercent(value) {
        return `${(Number(value) * 100).toFixed(1)}%`;
    }

    function formatFeatureName(name) {
        return name
            .replace(/^num__/, "")
            .replace(/^cat__/, "")
            .replace(/_/g, " ");
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

    function renderContractChart() {

        if (!contractChartRef.current || !contractData.length) return;

        if (contractChartInstanceRef.current) {
            contractChartInstanceRef.current.dispose();
        }

        const chart = echarts.init(contractChartRef.current);
        contractChartInstanceRef.current = chart;

        chart.setOption({

            tooltip: { trigger: "axis" },

            xAxis: {
                type: "category",
                data: contractData.map(c => c.contract_type)
            },

            yAxis: {
                type: "value"
            },

            series: [{
                type: "bar",
                data: contractData.map(c => c.churn_rate),
                label: {
                    show: true,
                    formatter: "{c}%"
                }
            }]
        });
    }

    function renderTenureChart() {

        if (!tenureChartRef.current || !tenureData.length) return;

        if (tenureChartInstanceRef.current) {
            tenureChartInstanceRef.current.dispose();
        }

        const chart = echarts.init(tenureChartRef.current);
        tenureChartInstanceRef.current = chart;

        chart.setOption({

            tooltip: { trigger: "axis" },

            xAxis: {
                type: "category",
                data: tenureData.map(t => t.tenure_group)
            },

            yAxis: {
                type: "value"
            },

            series: [{
                type: "bar",
                data: tenureData.map(t => t.churn_rate),
                label: {
                    show: true,
                    formatter: "{c}%"
                }
            }]
        });
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
                    <div style={cardStyle}>
                        <p style={labelStyle}>Churn rate</p>
                        <h2 style={valueStyle}>{Number(summary.churn_rate).toFixed(1)}%</h2>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Churned customers</p>
                        <h2 style={valueStyle}>{Number(summary.churn_customers).toLocaleString()}</h2>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Revenue at risk (monthly)</p>
                        <h2 style={valueStyle}>${Number(summary.revenue_at_risk_monthly).toLocaleString()}</h2>
                    </div>

                    <div style={cardStyle}>
                        <p style={labelStyle}>Customer base analysed</p>
                        <h2 style={valueStyle}>{Number(summary.total_customers).toLocaleString()}</h2>
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
                <div style={cardStyle}>
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Churn rate by contract</h3>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                            Comparativa del churn real según tipo de contrato
                        </p>
                    </div>

                    <div ref={contractChartRef} style={{ height: 360 }} />
                </div>

                <div style={cardStyle}>
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Churn rate by tenure</h3>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                            Evolución del churn según antigüedad del cliente
                        </p>
                    </div>

                    <div ref={tenureChartRef} style={{ height: 360 }} />
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                    alignItems: "stretch",
                    marginBottom: "24px"
                }}
            >
                <div style={cardStyle}>
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Predicted customer risk segmentation</h3>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                            Clientes agrupados por nivel de riesgo
                        </p>
                    </div>

                    <div ref={riskChartRef} style={{ height: 360 }} />
                </div>

                <div style={cardStyle}>
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Main churn drivers</h3>
                        <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                            Variables más influyentes del modelo
                        </p>
                    </div>

                    <div ref={featureChartRef} style={{ height: 360 }} />
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Customers with highest churn risk</h3>
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
            <div style={{ ...cardStyle, marginTop: "24px" }}>
                <div style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>High-value customers at risk</h3>
                    <p style={{ margin: "6px 0 0", color: "#666", fontSize: "14px" }}>
                        Clientes de alto valor económico con alto riesgo de churn
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
                                <th style={{ padding: "12px 8px" }}>Contract</th>
                            </tr>
                        </thead>
                        <tbody>
                            {highValueRisk.map((customer) => (
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
                                    <td style={{ padding: "12px 8px" }}>
                                        {customer.contract_type}
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

const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
};

const labelStyle = {
    margin: 0,
    color: "#666",
    fontSize: "14px"
};

const valueStyle = {
    margin: "10px 0 0",
    fontSize: "32px"
};