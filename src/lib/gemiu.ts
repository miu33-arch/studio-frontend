export interface AgentLogItem {
  step: number;
  thought?: string | null;
  action_tool?: string | null;
  action_args?: Record<string, any> | null;
  observation?: string | null;
}

export interface AgentRunResponse {
  status: string;
  tenant: string;
  latency_ms: number;
  credits_remaining: number;
  logs: AgentLogItem[];
  final_answer: string;
}

export interface FasahAuditRequest {
  vessel_eta_hours: number;
  has_commercial_invoice: boolean;
  has_packing_list: boolean;
  has_certificate_of_origin: boolean;
  declared_cif_sar: number;
}

export interface FasahAuditResponse {
  status: string;
  compliance_code: string;
  risk_level: string;
  rejection_reasons: string[];
  duty_sar: number;
  vat_sar: number;
  total_landed_sar: number;
  execution_latency_ms: number;
  credits_remaining: number;
}

const GEMIU_API_BASE = process.env.NEXT_PUBLIC_GEMIU_API_URL || "http://127.0.0.1:8000";
const GEMIU_API_KEY = process.env.NEXT_PUBLIC_GEMIU_API_KEY || "gmu_live_sec_prod01";

export async function dispatchTaskToGeMiu(prompt: string, max_steps = 3): Promise<AgentRunResponse> {
  const res = await fetch(`${GEMIU_API_BASE}/api/agent/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMIU_API_KEY}`,
    },
    body: JSON.stringify({ prompt, max_steps }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Gateway error with status ${res.status}`);
  }

  return res.json();
}

export async function runFasahPreflight(payload: FasahAuditRequest): Promise<FasahAuditResponse> {
  const res = await fetch(`${GEMIU_API_BASE}/v1/customs/fasah-preflight`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GEMIU_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Preflight failed with status ${res.status}`);
  }

  return res.json();
}