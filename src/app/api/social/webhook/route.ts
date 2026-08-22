import { NextRequest, NextResponse } from "next/server";
import { AutonomousGrowthEngine, InboundSocialInquiry } from "@/lib/flywheelWorker";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Standardize incoming webhook event (comments / DMs / mentions)
    const inquiry: InboundSocialInquiry = {
      platform: (payload.platform || "instagram").toLowerCase(),
      authorHandle: payload.author || payload.sender || "anonymous_lead",
      authorName: payload.authorName || payload.name,
      commentOrDmText: payload.text || payload.comment || payload.message || "",
      postRef: payload.postId || payload.id,
    };

    if (!inquiry.commentOrDmText) {
      return NextResponse.json({ received: true, ignored: "empty_text" });
    }

    // 1. Process via Sales AI Agent (Evaluates Hot/Warm/Cold + Drafts Reply)
    const evaluation = await AutonomousGrowthEngine.processInboundInquiry(inquiry);

    console.log(`[Flywheel Inbound] New ${evaluation.leadScore} lead on ${inquiry.platform}:`, {
      from: inquiry.authorHandle,
      intent: evaluation.intent,
      action: evaluation.actionRequired,
    });

    // 2. If it's a HOT or WARM prospect requesting pricing / custom builds, auto-reply or queue notification
    if (evaluation.isProspect && evaluation.actionRequired !== "IGNORE") {
      // Optional: Auto-reply directly back to the social thread
      if (payload.commentId || payload.conversationId) {
        await fetch("https://app.ayrshare.com/api/comments/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SOCIAL_GATEWAY_API_KEY}`,
          },
          body: JSON.stringify({
            commentId: payload.commentId,
            reply: evaluation.suggestedReply,
            platform: inquiry.platform,
          }),
        });
      }
    }

    return NextResponse.json({
      received: true,
      evaluation,
    });
  } catch (error: any) {
    console.error("[Social Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}