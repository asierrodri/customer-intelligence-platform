import { Link } from "react-router-dom";
import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ChurnPredict from "./pages/ChurnPredict";
import Customers from "./pages/Customers";

function App() {

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>

      <nav style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "20px 24px",
        display: "flex",
        gap: 20
      }}>
        <Link to="/">Dashboard</Link>
        <Link to="/customers">Customers</Link>
      </nav>

      <Routes>

        <Route
          path="/"
          element={
            <>
              <Dashboard />

              {/* <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
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
              </div> */}
            </>
          }
        />

        <Route path="/customers" element={<Customers />} />

      </Routes>

    </div>
  );
}

export default App;