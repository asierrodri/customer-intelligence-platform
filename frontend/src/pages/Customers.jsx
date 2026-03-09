import { useEffect, useState } from "react";
import { getCustomers } from "../api/client";

export default function Customers() {

    const [customers, setCustomers] = useState([]);
    const [riskFilter, setRiskFilter] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCustomers();
    }, [riskFilter]);

    async function loadCustomers() {

        const token = localStorage.getItem("token");

        try {

            const filters = {};

            if (riskFilter) {
                filters.risk = riskFilter;
            }

            const data = await getCustomers(token, filters);

            setCustomers(data);

        } catch (err) {

            console.error("Customers load error:", err);

        } finally {
            setLoading(false);
        }
    }

    if (loading) return <p>Loading customers...</p>;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>

            <h1>Customer Explorer</h1>

            <div style={{ marginBottom: 20 }}>

                <label>Risk filter: </label>

                <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                >
                    <option value="">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

            </div>

            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse"
                }}
            >

                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Probability</th>
                        <th>Risk</th>
                        <th>Tenure</th>
                        <th>Charges</th>
                        <th>Contract</th>
                    </tr>
                </thead>

                <tbody>

                    {customers.map(c => (

                        <tr key={c.customer_key}>

                            <td>{c.customer_key}</td>
                            <td>{(c.churn_proba * 100).toFixed(1)}%</td>
                            <td>{c.risk_level}</td>
                            <td>{c.tenure}</td>
                            <td>${Number(c.monthly_charges).toFixed(2)}</td>
                            <td>{c.contract_type}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );
}