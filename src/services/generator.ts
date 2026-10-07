import type { GenerateInput, GeneratedProject } from "../types";

export function defaultApiUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, "");
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:8787";
  }
  return window.location.origin;
}

export async function generateProject(input: GenerateInput, apiUrl: string, signal?: AbortSignal): Promise<GeneratedProject> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error(`Could not connect to the AI server at ${apiUrl}. Start it with node server/index.mjs or update the API URL in Settings.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong while generating your project.");
  if (!data.project?.files?.length) throw new Error("The server did not return a valid React project.");
  return data.project as GeneratedProject;
}

export async function getApiHealth(apiUrl: string): Promise<{ ok: boolean; configured: boolean; model: string }> {
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/health`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("API server is not available.");
  return response.json();
}