import { NextRequest, NextResponse } from "next/server";
import { AutonomousGrowthEngine } from "@/lib/flywheelWorker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, topic, duration = 30 } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "topic is required" },
        { status: 400 }
      );
    }

    // 1. Generate full script, studio signature, and hashtags with Gemini
    const campaign = await AutonomousGrowthEngine.generateReelCampaign(
      topic,
      duration <= 20 ? 20 : duration <= 30 ? 30 : 60
    );

    // Use actual video or standard preview asset
    const mediaUrlToBroadcast =
      videoUrl || "https://miu33archstudio.xyz/preview_sample.mp4";

    // 2. Build Multi-Platform Dispatch Payload for Upload-Post
    const formData = new FormData();
    formData.append("user", process.env.UPLOAD_POST_USER || "miu-studio");
    formData.append("video", mediaUrlToBroadcast);
    formData.append("title", campaign.captions.youtubeTitle || topic);
    formData.append("description", campaign.captions.linkedin);

    // Dispatch across your 4 active channels
    const activePlatforms = ["youtube", "instagram", "linkedin", "x"];
    activePlatforms.forEach((platform) => {
      formData.append("platform[]", platform);
    });

    const response = await fetch("https://api.upload-post.com/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Apikey ${process.env.UPLOAD_POST_API_KEY}`,
      },
      body: formData,
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      campaign,
      activeChannels: activePlatforms,
      dispatchResult: result,
    });
  } catch (error: any) {
    console.error("[Broadcast Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}