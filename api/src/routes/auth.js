import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email & password required" });

  const password_hash = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES (?,?,?)",
      [email, password_hash, role === "admin" ? "admin" : "viewer"]
    );
    res.json({ ok: true });
  } catch (e) {
    if (String(e?.code) === "ER_DUP_ENTRY") return res.status(409).json({ error: "User exists" });
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email & password required" });

  const [rows] = await pool.query("SELECT id,email,password_hash,role FROM users WHERE email = ?", [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: "8h" });
  res.json({ access_token: token });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;