import express from "express";
import cors from "cors";
import { readFileSync } from "node:fs";

type Job = {
  id: string;
  title: string;
  durationMinutes: number;
  rewardGold: number;
  staminaCost: number;
};

type GameConfig = {
  jobs?: Job[];
  randomJobs?: Job[];
};

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
) as { version?: string };
const apiVersion = packageJson.version || "0.0.0";
const gameConfig = JSON.parse(
  readFileSync(
    new URL("../../../packages/shared/config.json", import.meta.url),
    "utf-8",
  ),
) as GameConfig;

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: apiVersion });
});

app.get("/", (_req, res) => {
  res.json({ name: "idle-online-api", status: "ok" });
});

app.get("/api/hello", (_req, res) => {
  res.json({
    message: "Hello from API",
    time: new Date().toISOString(),
    version: apiVersion,
  });
});

app.get("/api/version", (_req, res) => {
  res.json({ version: apiVersion });
});

app.get("/api/config", (_req, res) => {
  res.json(gameConfig);
});

app.get("/api/jobs", (_req, res) => {
  const randomJobs = gameConfig.randomJobs || [];
  const randomJob = randomJobs.length
    ? randomJobs[Math.floor(Math.random() * randomJobs.length)]
    : null;
  res.json([
    ...(gameConfig.jobs || []),
    ...(randomJob
      ? [
          {
            ...randomJob,
            id: `job-random-${randomJob.id}`,
          },
        ]
      : []),
  ]);
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
