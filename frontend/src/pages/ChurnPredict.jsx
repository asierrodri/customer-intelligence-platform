import { useState } from "react";
import { predictTelco } from "../api/client";

export default function ChurnPredict() {

  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    gender: "Female",
    SeniorCitizen: 0,
    Partner: "Yes",
    Dependents: "No",
    tenure: 12,
    PhoneService: "Yes",
    MultipleLines: "No",
    InternetService: "Fiber optic",
    OnlineSecurity: "No",
    OnlineBackup: "Yes",
    DeviceProtection: "No",
    TechSupport: "No",
    StreamingTV: "Yes",
    StreamingMovies: "Yes",
    Contract: "Month-to-month",
    PaperlessBilling: "Yes",
    PaymentMethod: "Electronic check",
    MonthlyCharges: 85.5,
    TotalCharges: 1026
  });

  async function handleSubmit(e) {

    e.preventDefault();

    const token = localStorage.getItem("token");

    const res = await predictTelco(form, token);

    setResult(res);
  }

  return (
    <div>

      <h2>Customer Churn Prediction</h2>

      <form onSubmit={handleSubmit}>

        <label>Tenure</label>
        <input
          type="number"
          value={form.tenure}
          onChange={e => setForm({...form, tenure:Number(e.target.value)})}
        />

        <label>Monthly Charges</label>
        <input
          type="number"
          value={form.MonthlyCharges}
          onChange={e => setForm({...form, MonthlyCharges:Number(e.target.value)})}
        />

        <button type="submit">Predict</button>

      </form>

      {result && (
        <div style={{marginTop:20}}>

          <h3>Result</h3>

          <p>Probability: {result.churn_probability}</p>

          <p>
            Prediction:
            {result.churn_prediction === 1 ? " Will churn" : " Will stay"}
          </p>

        </div>
      )}

    </div>
  );
}