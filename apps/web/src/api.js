const baseUrl = import.meta.env.VITE_API_URL || "";

export async function fetchHealth() {
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) throw new Error("health check failed");
  return response.json();
}

export async function fetchHello() {
  const response = await fetch(`${baseUrl}/api/hello`);
  if (!response.ok) throw new Error("hello failed");
  return response.json();
}

export async function fetchJobs() {
  const response = await fetch(`${baseUrl}/api/jobs`);
  if (!response.ok) throw new Error("jobs failed");
  return response.json();
}
