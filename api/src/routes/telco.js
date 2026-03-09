import { Router } from "express";
import axios from "axios";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";
import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Predicción (protegido)
router.post("/predict", requireAuth, async (req, res) => {
  try {
    const mlRes = await axios.post(
      `${config.mlBaseUrl}/telco/predict`,
      req.body
    );

    const { churn_probability, churn_prediction, model_version } = mlRes.data;

    const customer_key = req.body?.customerID || "unknown";

    const risk_level =
      churn_probability >= 0.7
        ? "high"
        : churn_probability >= 0.4
          ? "medium"
          : "low";

    await pool.query(
      `
      INSERT INTO predictions_telco (
        customer_key,
        churn_proba,
        prediction,
        risk_level,
        tenure,
        monthly_charges,
        contract_type,
        model_version
      ) VALUES (?,?,?,?,?,?,?,?)
      `,
      [
        String(customer_key),
        Number(churn_probability),
        Number(churn_prediction),
        risk_level,
        req.body?.tenure ?? null,
        req.body?.MonthlyCharges ?? null,
        req.body?.Contract ?? null,
        String(model_version)
      ]
    );

    res.json({
      churn_probability,
      churn_prediction,
      model_version
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "ML service error" });
  }
});

// Ranking (demo)
router.get("/predictions/top", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        customer_key,
        churn_proba,
        prediction,
        risk_level,
        tenure,
        monthly_charges,
        contract_type,
        model_version,
        created_at
      FROM predictions_telco
      ORDER BY churn_proba DESC
      LIMIT 50
      `
    );

    res.json({ items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "predictions top error" });
  }
});

// Dashboard summary
router.get("/dashboard/summary", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ROUND(AVG(churn_proba), 4) AS avg_churn_probability,
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_risk_customers,
        COUNT(*) AS customers_scored
      FROM predictions_telco
    `);

    res.json({
      avg_churn_probability: Number(rows[0].avg_churn_probability),
      high_risk_customers: Number(rows[0].high_risk_customers),
      customers_scored: Number(rows[0].customers_scored),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "summary error" });
  }
});

// Churn distribution
router.get("/dashboard/distribution", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        risk_level,
        COUNT(*) AS total
      FROM predictions_telco
      GROUP BY risk_level
      ORDER BY FIELD(risk_level, 'low', 'medium', 'high')
    `);

    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "distribution error" });
  }
});

// Top churn customers
router.get("/dashboard/top", requireAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const [rows] = await pool.query(
      `
      SELECT
        customer_key,
        churn_proba,
        prediction,
        risk_level,
        tenure,
        monthly_charges,
        contract_type
      FROM predictions_telco
      ORDER BY churn_proba DESC
      LIMIT ?
      `,
      [limit]
    );

    res.json(
      rows.map((row) => ({
        customer_key: row.customer_key,
        churn_proba: Number(row.churn_proba),
        prediction: Number(row.prediction),
        risk_level: row.risk_level,
        tenure: Number(row.tenure),
        monthly_charges: Number(row.monthly_charges),
        contract_type: row.contract_type,
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "top error" });
  }
});

router.get("/dashboard/feature-importance", requireAuth, async (req, res) => {
  try {
    const filePath = path.resolve(__dirname, "../../../ml/artifacts/feature_importance.json");

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "feature importance error" });
  }
});

export default router;