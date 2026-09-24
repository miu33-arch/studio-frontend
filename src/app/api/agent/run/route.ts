import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Uses env variable in production, falls back to local loopback in development
    const backendUrl =
      process.env.GEMIU_BACKEND_URL || "http://127.0.0.1:8000";

    const backendRes = await fetch(`${backendUrl}/api/agent/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return NextResponse.json(
        { error: `Backend returned ${backendRes.status}: ${errText}` },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to reach backend engine";
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
}