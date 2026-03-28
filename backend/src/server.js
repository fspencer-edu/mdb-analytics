import express from "express";
import cors from "cors";
import "dotenv/config";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import analyticsRoutes from "./routes/analytics.js";

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");
const etlDir = path.join(projectRoot, "etl");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Analytics API running" });
});

app.use("/api", analyticsRoutes);

app.post("/api/run-etl", (req, res) => {
  const command = `
    cd "${etlDir}" && \
    source .venv/bin/activate && \
    python load_data.py
  `;

  exec(command, { shell: "/bin/bash" }, (error, stdout, stderr) => {
    if (error) {
      console.error("ETL error:", error);
      return res.status(500).json({
        ok: false,
        message: "ETL failed",
        error: stderr || error.message
      });
    }

    res.json({
      ok: true,
      message: "ETL complete",
      output: stdout
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});