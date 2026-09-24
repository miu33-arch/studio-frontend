export interface AgentLogItem {
  output?: string;
  tool?: string;
  args?: Record<string, unknown>;
  observation?: string;
}

export interface AgentRunResponse {
  status: string;
  logs: AgentLogItem[];
}

export async function dispatchTaskToGeMiu(
  prompt: string,
  maxSteps: number = 5
): Promise<AgentRunResponse> {
const res = await fetch("/api/agent/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, max_steps: maxSteps }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Agent dispatch failed with status ${res.status}: ${errorText || res.statusText}`
    );
  }

  const data: AgentRunResponse = await res.json();
  return data;
}