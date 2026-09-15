import { NextRequest, NextResponse } from "next/server";

const WORKER_BASE = process.env.WORKER_BASE_URL || "https://ledger.padillaanamy83.workers.dev";
const WORKER_TOKEN = process.env.WORKER_BEARER_TOKEN || "MIU33-LEDGER-2026";

async function forwardToWorker(req: NextRequest, slug: string[]) {
  const targetPath = slug.join("/");
  const url = new URL(req.url);
  const targetUrl = `${WORKER_BASE}/api/${targetPath}${url.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${WORKER_TOKEN}`);
  headers.set("Content-Type", "application/json");

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      init.body = await req.text();
    } catch (_) {}
  }

  try {
    const workerRes = await fetch(targetUrl, init);
    const data = await workerRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: workerRes.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Edge worker dispatch failed", details: err.message },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await context.params;
  return forwardToWorker(req, slug);
}

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await context.params;
  return forwardToWorker(req, slug);
}