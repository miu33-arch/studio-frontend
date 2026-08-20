import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { target_phone, task_prompt, from_number } = body;

    if (!target_phone) {
      return NextResponse.json(
        { error: "Missing required parameter: target_phone" },
        { status: 400 }
      );
    }

    const blandApiKey = process.env.BLAND_AI_API_KEY;
    const encryptedKey = process.env.BLAND_TWILIO_ENCRYPTED_KEY;

    // 💡 DRY-RUN / DEV SIMULATION MODE:
    // If no key is configured or set to placeholder, simulate success for demoing
    if (!blandApiKey || blandApiKey.includes("your_bland_api_key")) {
      console.log("[DEV MODE] Simulating Bland AI Voice Call to:", target_phone);
      
      // Simulate 1.2s network latency
      await new Promise((resolve) => setTimeout(resolve, 1200));

      return NextResponse.json({
        success: true,
        call_id: `mock_call_${Date.now()}`,
        status: "queued_simulation",
        message: "⚡ Simulated dispatch successful (Dev Mode: No active carrier charge)",
      });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      authorization: blandApiKey,
    };

    if (encryptedKey) {
      headers["encrypted_key"] = encryptedKey;
    }

    // Live Bland AI API Call
    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        phone_number: target_phone,
        task: task_prompt || "You are the AI Assistant for MIU Studio.",
        from: from_number || undefined,
        voice: "nat",
        reduce_latency: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Fallback response if Bland rejects due to unpaid plan/balance
      return NextResponse.json(
        { error: data.message || "Bland AI account requires active credits or upgrade." },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      call_id: data.call_id,
      status: data.status,
    });
  } catch (error: any) {
    console.error("[VOICE_DISPATCH_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Internal voice routing error" },
      { status: 500 }
    );
  }
}