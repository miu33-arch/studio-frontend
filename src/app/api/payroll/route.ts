import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const workerUrl = process.env.WORKER_BASE_URL;
    const workerToken = process.env.WORKER_BEARER_TOKEN;

    if (!workerUrl || !workerToken) {
      return NextResponse.json(
        { error: "Server misconfiguration: Worker credentials missing." },
        { status: 500 }
      );
    }

    const workerResponse = await fetch(`${workerUrl}/api/payroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${workerToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await workerResponse.json();

    return NextResponse.json(data, { status: workerResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to dispatch to edge runtime", details: error.message },
      { status: 500 }
    );
  }
}