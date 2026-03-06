import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "change_me",
  db: {
    host: process.env.DB_HOST || "mysql",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "cip_user",
    password: process.env.DB_PASSWORD || "cip_password",
    database: process.env.DB_NAME || "cip"
  },
  mlBaseUrl: process.env.ML_BASE_URL || "http://ml:8000"
};