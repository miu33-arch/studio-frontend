import { GoogleGenAI } from "@google/genai";

// Initialize Google Gen AI SDK (picks up GEMINI_API_KEY from env)
const ai = new GoogleGenAI();

export const STUDIO_PORTAL_URL = "https://miu33archstudio.xyz";
export const STUDIO_SIGNATURE = `⚡ Generated via MIU_33 Core Engine\n🔗 Deploy yours: ${STUDIO_PORTAL_URL}`;

export interface GrowthCampaignResult {
  hook: string;
  voiceoverText: string;
  targetDurationSeconds: number;
  visualCues: string[];
  videoPromptForFal: string;
  captions: {
    instagram: string;
    tiktok: string;
    linkedin: string;
    x: string;
    youtubeTitle: string;
    youtubeDescription: string;
    redditTitle: string;
    redditBody: string;
  };
}

export interface InboundSocialInquiry {
  platform: "youtube" | "tiktok" | "instagram" | "reddit" | "linkedin" | "x";
  authorHandle: string;
  authorName?: string;
  commentOrDmText: string;
  postRef?: string;
}

export interface QualifiedLeadResponse {
  isProspect: boolean;
  intent: "inquiry_pricing" | "request_demo" | "custom_build" | "general_comment" | "spam";
  leadScore: "HOT" | "WARM" | "COLD" | "DISQUALIFIED";
  suggestedReply: string;
  actionRequired: "DIRECT_DM" | "SCHEDULE_CALL" | "SEND_PROPOSAL_LINK" | "AUTO_REPLY_ONLY" | "IGNORE";
  reasoning: string;
}

export class AutonomousGrowthEngine {
  /**
   * 1. Generates 15–30s Reel scripts, fal.ai visual descriptors,
   * platform captions with signature + live portal link + niche hashtags.
   */
 static async generateReelCampaign(
  topic: string,
  durationSec: 15 | 20 | 30 | 60 = 20
): Promise<GrowthCampaignResult> {
    const wordLimit = durationSec <= 20 ? 35 : durationSec <= 30 ? 60 : 120;
    
    const prompt = `
      You are the Autonomous Growth Marketing Director for MIU_33 Studio (an elite AI & Spatial Cyber-Architectural Studio).
      Generate a viral, high-authority short video script (9:16 vertical Reel format, ~${durationSec}s duration) demonstrating advanced 3D spatial tech, generative BIM, LiDAR point clouds, or AI architectural workflows.

      TOPIC: ${topic}
      VOICEOVER WORD LIMIT: Maximum ${wordLimit} words.

      STRICT MANDATORY RULES FOR ALL CAPTIONS:
      1. Every platform caption MUST strictly conclude with the studio attribution and live portal link:
         "${STUDIO_SIGNATURE}"
      2. Immediately following the link, include 4–7 high-performing niche hashtags (e.g., #MIU33 #SpatialComputing #AIArchitecture #GenerativeDesign #ArchViz #WebGL #TechInnovation).
      3. Tailor tone by platform:
         - LinkedIn: High-level B2B engineering insight & architectural tech workflow.
         - X (Twitter): Sharp, punchy tech take with bold hooks.
         - Instagram & TikTok: High-energy visual hook with clear call to action.
         - Reddit: Transparent case study headline and technical context (no overt corporate hype).
         - YouTube: High-CTR Shorts title + concise description.

      Return strictly valid JSON matching this schema:
      {
        "hook": "Opening 3-second visual and audio hook",
        "voiceoverText": "Narration script under ${wordLimit} words",
        "targetDurationSeconds": ${durationSec},
        "visualCues": ["Visual scene 1 description", "Visual scene 2 description", "Visual scene 3 description"],
        "videoPromptForFal": "Detailed visual prompt for 9:16 video diffusion (cinematic camera sweep, neon cyan/violet cyber-brutalist architecture, wireframe LiDAR meshes, hyper-detailed)",
        "captions": {
          "instagram": "Full Instagram caption...",
          "tiktok": "Full TikTok caption...",
          "linkedin": "Full LinkedIn post...",
          "x": "Short tweet text...",
          "youtubeTitle": "High CTR Shorts Title",
          "youtubeDescription": "Shorts description...",
          "redditTitle": "Case-study headline for r/architecture or r/webgl",
          "redditBody": "Brief technical case study breakdown..."
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const parsed: GrowthCampaignResult = JSON.parse(response.text || "{}");
    return this.ensureAttribution(parsed);
  }

  /**
   * 2. Attribution, Link, and Hashtag Enforcement Layer
   */
  private static ensureAttribution(campaignData: GrowthCampaignResult): GrowthCampaignResult {
    const defaultTagMap: Record<string, string> = {
      instagram: "#MIU33 #AIArchitecture #SpatialDesign #ArchViz #CreativeTech #GenerativeAI",
      tiktok: "#MIU33 #TechTok #3DDesign #Architecture #GenerativeAI #CreativeCoder",
      linkedin: "#SpatialComputing #DigitalArchitecture #GenerativeAI #PropTech #MIU33",
      x: "#MIU33 #AIArchitecture #BuildInPublic #SpatialDesign",
      youtubeDescription: "#Shorts #MIU33 #SpatialComputing #GenerativeDesign #ArchViz",
      redditBody: "#MIU33 #CreativeTech",
    };

    if (campaignData.captions) {
      for (const [platform, defaultTags] of Object.entries(defaultTagMap)) {
        const key = platform as keyof typeof campaignData.captions;
        if (campaignData.captions[key]) {
          if (!campaignData.captions[key].includes(STUDIO_PORTAL_URL)) {
            campaignData.captions[key] = `${campaignData.captions[key]}\n\n${STUDIO_SIGNATURE}\n${defaultTags}`;
          }
        }
      }
    }

    return campaignData;
  }

  /**
   * 3. Autonomous Inbound Sales AI Agent: Lead Qualification & Auto-Response
   * Trigger this whenever a webhook receives a comment or DM from any connected social platform.
   */
  static async processInboundInquiry(inquiry: InboundSocialInquiry): Promise<QualifiedLeadResponse> {
    const prompt = `
      You are the Autonomous AI Sales Executive for MIU_33 Studio (an elite AI & Spatial Cyber-Architectural Studio led by Miu).
      A potential client or viewer commented/inquired on our ${inquiry.platform} content.
      
      AUTHOR: @${inquiry.authorHandle} ${inquiry.authorName ? `(${inquiry.authorName})` : ""}
      MESSAGE/COMMENT: "${inquiry.commentOrDmText}"
      STUDIO PORTAL: ${STUDIO_PORTAL_URL}

      TASK:
      1. Analyze if this is a genuine prospective client, collaborator, or general user.
      2. Categorize intent and assign a Lead Score (HOT, WARM, COLD, DISQUALIFIED).
      3. Craft a natural, authentic, highly professional response matching the persona of an elite tech studio (authoritative, sharp, welcoming, concise).
      4. If they ask about services, pricing, integration, or custom builds, direct them politely to our portal: ${STUDIO_PORTAL_URL}.

      Return strictly valid JSON matching this schema:
      {
        "isProspect": true,
        "intent": "inquiry_pricing" | "request_demo" | "custom_build" | "general_comment" | "spam",
        "leadScore": "HOT" | "WARM" | "COLD" | "DISQUALIFIED",
        "suggestedReply": "Drafted reply ready to post or send as DM...",
        "actionRequired": "DIRECT_DM" | "SCHEDULE_CALL" | "SEND_PROPOSAL_LINK" | "AUTO_REPLY_ONLY" | "IGNORE",
        "reasoning": "Brief justification for the lead score and reply strategy"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    return JSON.parse(response.text || "{}");
  }

  /**
   * 4. Multi-Channel Auto-Broadcaster
   */
  static async broadcastToPlatforms(
    videoUrl: string,
    campaign: GrowthCampaignResult,
    platforms: ("youtube" | "tiktok" | "instagram" | "reddit" | "linkedin" | "x")[]
  ) {
    return Promise.allSettled(
      platforms.map(async (platform) => {
        switch (platform) {
          case "youtube":
            return { platform: "youtube", status: "queued", title: campaign.captions.youtubeTitle, media: videoUrl };
          case "tiktok":
            return { platform: "tiktok", status: "queued", caption: campaign.captions.tiktok, media: videoUrl };
          case "instagram":
            return { platform: "instagram", status: "queued", caption: campaign.captions.instagram, media: videoUrl };
          case "linkedin":
            return { platform: "linkedin", status: "queued", text: campaign.captions.linkedin, media: videoUrl };
          case "x":
            return { platform: "x", status: "queued", text: campaign.captions.x, media: videoUrl };
          case "reddit":
            return { platform: "reddit", status: "queued", title: campaign.captions.redditTitle, body: campaign.captions.redditBody, media: videoUrl };
        }
      })
    );
  }
}