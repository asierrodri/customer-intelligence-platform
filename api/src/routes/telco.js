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

/*
  IMPORTANTE:
  - predictions_telco -> tabla de scoring/predicciones
  - telco_customers   -> tabla base con datos históricos reales

  Si tu tabla base tiene otro nombre, cambia TELCO_SOURCE_TABLE.
*/
const TELCO_SOURCE_TABLE = "telco_customers";

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

// Ranking predicciones (demo)
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

/*
  =========================
  DASHBOARD - BUSINESS VIEW
  =========================
  Estas métricas salen de la tabla histórica real.
  Son mejores para entrevista porque reflejan problema de negocio real.
*/
router.get("/dashboard/summary", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total_customers,
        SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS churn_customers,
        ROUND(
          SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*) * 100,
          2
        ) AS churn_rate,
        ROUND(AVG(MonthlyCharges), 2) AS avg_monthly_charges,
        ROUND(
          SUM(CASE WHEN Churn = 'Yes' THEN MonthlyCharges ELSE 0 END),
          2
        ) AS revenue_at_risk_monthly
      FROM ${TELCO_SOURCE_TABLE}
      `
    );

    const row = rows[0] || {};

    res.json({
      total_customers: Number(row.total_customers || 0),
      churn_customers: Number(row.churn_customers || 0),
      churn_rate: Number(row.churn_rate || 0),
      avg_monthly_charges: Number(row.avg_monthly_charges || 0),
      revenue_at_risk_monthly: Number(row.revenue_at_risk_monthly || 0)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "summary error" });
  }
});

/*
  Segmentación por riesgo del modelo
  Esto sí sale de predictions_telco porque representa el scoring.
*/
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

    res.json(
      rows.map((row) => ({
        risk_level: row.risk_level,
        total: Number(row.total)
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "distribution error" });
  }
});

// Churn real por tipo de contrato
router.get("/dashboard/churn-by-contract", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        Contract AS contract_type,
        COUNT(*) AS total_customers,
        SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS churn_customers,
        ROUND(
          SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*) * 100,
          2
        ) AS churn_rate
      FROM ${TELCO_SOURCE_TABLE}
      GROUP BY Contract
      ORDER BY churn_rate DESC
      `
    );

    res.json(
      rows.map((row) => ({
        contract_type: row.contract_type,
        total_customers: Number(row.total_customers),
        churn_customers: Number(row.churn_customers),
        churn_rate: Number(row.churn_rate)
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "churn by contract error" });
  }
});

// Churn real por buckets de tenure
router.get("/dashboard/churn-by-tenure", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        CASE
          WHEN tenure <= 12 THEN '0-12'
          WHEN tenure <= 24 THEN '13-24'
          WHEN tenure <= 48 THEN '25-48'
          ELSE '49+'
        END AS tenure_group,
        COUNT(*) AS total_customers,
        SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS churn_customers,
        ROUND(
          SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) / COUNT(*) * 100,
          2
        ) AS churn_rate
      FROM ${TELCO_SOURCE_TABLE}
      GROUP BY tenure_group
      ORDER BY FIELD(tenure_group, '0-12', '13-24', '25-48', '49+')
      `
    );

    res.json(
      rows.map((row) => ({
        tenure_group: row.tenure_group,
        total_customers: Number(row.total_customers),
        churn_customers: Number(row.churn_customers),
        churn_rate: Number(row.churn_rate)
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "churn by tenure error" });
  }
});

// Top churn customers según scoring del modelo
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
        contract_type: row.contract_type
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "top error" });
  }
});

// Feature importance desde artifacts
router.get("/dashboard/feature-importance", requireAuth, async (req, res) => {
  try {
    const filePath = path.resolve(
      __dirname,
      "../../../ml/artifacts/feature_importance.json"
    );

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    // Si quieres dejarlo más limpio para el dashboard:
    const top10 = Array.isArray(data) ? data.slice(0, 10) : data;

    res.json(top10);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "feature importance error" });
  }
});

// Explorer de clientes scoreados
router.get("/customers", requireAuth, async (req, res) => {
  try {
    const { risk, contract, limit = 50 } = req.query;

    let query = `
      SELECT
        customer_key,
        churn_proba,
        risk_level,
        tenure,
        monthly_charges,
        contract_type
      FROM predictions_telco
      WHERE 1=1
    `;

    const params = [];

    if (risk) {
      query += " AND risk_level = ?";
      params.push(risk);
    }

    if (contract) {
      query += " AND contract_type = ?";
      params.push(contract);
    }

    query += " ORDER BY churn_proba DESC LIMIT ?";
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);

    res.json(
      rows.map((row) => ({
        customer_key: row.customer_key,
        churn_proba: Number(row.churn_proba),
        risk_level: row.risk_level,
        tenure: Number(row.tenure),
        monthly_charges: Number(row.monthly_charges),
        contract_type: row.contract_type
      }))
    );
  } catch (err) {
    console.error("Customers query error:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Top high-value customers at risk
router.get("/dashboard/high-value-risk", requireAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const [rows] = await pool.query(
      `
      SELECT
        customer_key,
        churn_proba,
        risk_level,
        tenure,
        monthly_charges,
        contract_type
      FROM predictions_telco
      WHERE risk_level = 'high'
        AND monthly_charges IS NOT NULL
      ORDER BY monthly_charges DESC, churn_proba DESC
      LIMIT ?
      `,
      [limit]
    );

    res.json(
      rows.map((row) => ({
        customer_key: row.customer_key,
        churn_proba: Number(row.churn_proba),
        risk_level: row.risk_level,
        tenure: Number(row.tenure),
        monthly_charges: Number(row.monthly_charges),
        contract_type: row.contract_type
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "high value risk error" });
  }
});

export default router;