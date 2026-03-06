import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import telcoRoutes from "./routes/telco.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/telco", telcoRoutes);

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});