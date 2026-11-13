import path from "node:path";
import { HiggsfieldClient, HiggsfieldVideoRequest } from "../connectors/media/higgsfield.js";
import { Tool, ToolContext, ToolResult } from "./types.js";

const client = new HiggsfieldClient();

export const mediaGenerateVideoTool: Tool = {
  definition: {
    name: "media_generate_video",
    description: "Generate a cinematic video or motion asset using Higgsfield AI video generation.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Detailed visual and motion prompt for video generation" },
        imageUrl: { type: "string", description: "Optional starting image URL for image-to-video animation" },
        outputPath: { type: "string", description: "Destination path in workspace (e.g. public/videos/hero-promo.mp4)" },
        durationSeconds: { type: "number", description: "Duration in seconds (e.g. 5)" },
        cameraMotion: {
          type: "string",
          enum: ["pan_left", "pan_right", "zoom_in", "zoom_out", "orbit_clockwise", "tilt_up", "tilt_down"],
          description: "Camera motion trajectory",
        },
      },
      required: ["prompt", "outputPath"],
    },
  },
  async execute(
    args: { prompt: string; imageUrl?: string; outputPath: string; durationSeconds?: number; cameraMotion?: any },
    context: ToolContext
  ): Promise<ToolResult> {
    try {
      const fullDest = path.resolve(context.workspaceDir, args.outputPath);
      const req: HiggsfieldVideoRequest = {
        prompt: args.prompt,
        imageUrl: args.imageUrl,
        durationSeconds: args.durationSeconds || 5,
        cameraMotion: args.cameraMotion,
      };

      const task = await client.generateVideo(req);
      const status = await client.pollTask(task.taskId);

      if (status.status === "failed" || !status.videoUrl) {
        return { success: false, output: "", error: `Video generation failed: ${status.error || "No video produced"}` };
      }

      await client.downloadVideo(status.videoUrl, fullDest);
      return {
        success: true,
        output: `Generated and saved video asset to ${args.outputPath} (Task: ${task.taskId}, Duration: ${req.durationSeconds}s)`,
      };
    } catch (err: any) {
      return { success: false, output: "", error: err.message };
    }
  },
};
