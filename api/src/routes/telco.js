import { Router } from "express";
import axios from "axios";
import { requireAuth } from "../middleware/auth.js";
import { config } from "../config.js";
import { pool } from "../db.js";

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

    await pool.query(
      "INSERT INTO predictions_telco (customer_key, churn_proba, model_version) VALUES (?,?,?)",
      [String(customer_key), Number(churn_probability), String(model_version)]
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
  const [rows] = await pool.query(
    "SELECT customer_key, churn_proba, model_version, created_at FROM predictions_telco ORDER BY churn_proba DESC LIMIT 50"
  );
  res.json({ items: rows });
});

export default router;