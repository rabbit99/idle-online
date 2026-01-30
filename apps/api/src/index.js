import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
);
const apiVersion = packageJson.version || "0.0.0";

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", version: apiVersion });
});

app.get("/", (req, res) => {
  res.json({ name: "idle-online-api", status: "ok" });
});

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello from API",
    time: new Date().toISOString(),
    version: apiVersion,
  });
});

app.get("/api/version", (req, res) => {
  res.json({ version: apiVersion });
});

app.get("/api/jobs", (req, res) => {
  const randomJobs = [
    {
      id: "job-intern",
      title: "實習生",
      durationMinutes: 30,
      rewardGold: 5,
      staminaCost: 2,
    },
    {
      id: "job-designer",
      title: "UI 設計師",
      durationMinutes: 90,
      rewardGold: 18,
      staminaCost: 7,
    },
    {
      id: "job-marketer",
      title: "行銷企劃",
      durationMinutes: 120,
      rewardGold: 22,
      staminaCost: 8,
    },
    {
      id: "job-analyst",
      title: "數據分析師",
      durationMinutes: 180,
      rewardGold: 30,
      staminaCost: 10,
    },
  ];
  const randomJob = randomJobs[Math.floor(Math.random() * randomJobs.length)];
  res.json([
    {
      id: "job-copywriter",
      title: "文案員",
      durationMinutes: 660,
      rewardGold: 10,
      staminaCost: 5,
    },
    {
      id: "job-senior-engineer",
      title: "資深工程師",
      durationMinutes: 240,
      rewardGold: 80,
      staminaCost: 20,
    },
    {
      ...randomJob,
      id: `job-random-${randomJob.id}`,
    },
  ]);
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
