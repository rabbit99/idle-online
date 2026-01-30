import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from API", time: new Date().toISOString() });
});

app.get("/api/jobs", (req, res) => {
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
  ]);
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
