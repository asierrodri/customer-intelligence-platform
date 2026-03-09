import Dashboard from "./pages/Dashboard";
import ChurnPredict from "./pages/ChurnPredict";

function App() {
  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <Dashboard />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
          }}
        >
          <ChurnPredict />
        </div>
      </div>
    </div>
  );
}

export default App;