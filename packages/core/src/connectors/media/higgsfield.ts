import fs from "node:fs";
import path from "node:path";

export interface HiggsfieldVideoRequest {
  prompt: string;
  imageUrl?: string;
  durationSeconds?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  cameraMotion?: "pan_left" | "pan_right" | "zoom_in" | "zoom_out" | "orbit_clockwise" | "tilt_up" | "tilt_down";
  seed?: number;
}

export interface HiggsfieldTaskStatus {
  taskId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  progress?: number;
  error?: string;
}

export class HiggsfieldClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl = "https://api.higgsfield.ai/v1") {
    this.apiKey = apiKey || process.env.HIGGSFIELD_API_KEY || "";
    this.baseUrl = baseUrl;
  }

  async generateVideo(request: HiggsfieldVideoRequest): Promise<{ taskId: string; estimatedDuration: number }> {
    if (!this.apiKey) {
      // Mock sandbox mode when API key is not yet configured
      const mockTaskId = `hf-mock-${Date.now()}`;
      return { taskId: mockTaskId, estimatedDuration: 15 };
    }

    const res = await fetch(`${this.baseUrl}/video/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: request.prompt,
        image_url: request.imageUrl,
        duration: request.durationSeconds || 5,
        aspect_ratio: request.aspectRatio || "16:9",
        camera_motion: request.cameraMotion,
        seed: request.seed,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Higgsfield API error (${res.status}): ${errText}`);
    }

    const data = (await res.json()) as any;
    return { taskId: data.task_id || data.id, estimatedDuration: data.estimated_duration || 30 };
  }

  async pollTask(taskId: string): Promise<HiggsfieldTaskStatus> {
    if (!this.apiKey || taskId.startsWith("hf-mock-")) {
      // Mock completion response for testing and offline development
      return {
        taskId,
        status: "completed",
        videoUrl: "https://assets.recode.dev/mock/higgsfield-cinematic-preview.mp4",
        progress: 100,
      };
    }

    const res = await fetch(`${this.baseUrl}/video/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to query Higgsfield task: ${res.statusText}`);
    }

    const data = (await res.json()) as any;
    return {
      taskId,
      status: data.status,
      videoUrl: data.video_url || data.output?.url,
      progress: data.progress || (data.status === "completed" ? 100 : 50),
      error: data.error,
    };
  }

  async downloadVideo(videoUrl: string, destinationPath: string): Promise<string> {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    if (videoUrl.includes("mock")) {
      // Create a mock MP4 placeholder file for sandbox testing
      fs.writeFileSync(destinationPath, Buffer.from("ftypisomRecodeMockVideoAsset"), "utf-8");
      return destinationPath;
    }

    const res = await fetch(videoUrl);
    if (!res.ok) {
      throw new Error(`Failed to download video from ${videoUrl}: ${res.statusText}`);
    }

    const buffer = await res.arrayBuffer();
    fs.writeFileSync(destinationPath, Buffer.from(buffer));
    return destinationPath;
  }
}
