import * as mariadb from "mariadb";
import "dotenv/config";

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || "analytics_user",
  password: process.env.DB_PASSWORD || "analytics_pass",
  database: process.env.DB_NAME || "analytics_db",
  connectionLimit: 5
});

export default pool;