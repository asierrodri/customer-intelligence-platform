import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function App() {
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      title: { text: "Demo ECharts (placeholder)" },
      tooltip: {},
      xAxis: { type: "category", data: ["A", "B", "C", "D"] },
      yAxis: { type: "value" },
      series: [{ type: "bar", data: [0.2, 0.5, 0.35, 0.7] }]
    });
    return () => chart.dispose();
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1>Customer Intelligence Platform</h1>
      <p>API: {API}</p>
      <div ref={chartRef} style={{ width: "100%", height: 420 }} />
    </div>
  );
}