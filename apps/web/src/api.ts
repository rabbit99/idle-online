const baseUrl = import.meta.env.VITE_API_URL || "";

export type HealthResponse = { status: string };
export type HelloResponse = {
  message: string;
  time?: string;
  version?: string;
};
export type Job = {
  id: string;
  title: string;
  durationMinutes: number;
  rewardGold: number;
  staminaCost: number;
};
export type ApiVersionResponse = { version: string };
export type GameConfig = {
  initial?: { stamina?: number; gold?: number; checkedIn?: boolean };
  checkIn?: { staminaReward?: number };
  jobs?: Job[];
  randomJobs?: Job[];
};

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) throw new Error("health check failed");
  return response.json();
}

export async function fetchHello(): Promise<HelloResponse> {
  const response = await fetch(`${baseUrl}/api/hello`);
  if (!response.ok) throw new Error("hello failed");
  return response.json();
}

export async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(`${baseUrl}/api/jobs`);
  if (!response.ok) throw new Error("jobs failed");
  return response.json();
}

export async function fetchApiVersion(): Promise<ApiVersionResponse> {
  const response = await fetch(`${baseUrl}/api/version`);
  if (!response.ok) throw new Error("version failed");
  return response.json();
}

export async function fetchGameConfig(): Promise<GameConfig> {
  const response = await fetch(`${baseUrl}/api/config`);
  if (!response.ok) throw new Error("config failed");
  return response.json();
}
