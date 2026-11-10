import fs from "node:fs";
import path from "node:path";
import { ChatMessage } from "../llm/types.js";
import { AuthStore } from "../auth/store.js";

export interface SavedChat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  mode?: string;
  messages: ChatMessage[];
}

export interface ChatMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  model?: string;
  mode?: string;
}

export class ChatStore {
  private static customDir: string | null = null;

  public static setCustomDir(dir: string): void {
    this.customDir = dir;
  }

  public static getDirectory(): string {
    if (this.customDir) return this.customDir;

    const configPath = AuthStore.getPath();
    const baseDir = path.dirname(configPath);
    const chatsDir = path.join(baseDir, "chats");
    if (!fs.existsSync(chatsDir)) {
      try {
        fs.mkdirSync(chatsDir, { recursive: true });
      } catch {}
    }
    return chatsDir;
  }

  public static saveChat(chat: SavedChat): void {
    const dir = this.getDirectory();
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    const safeId = chat.id.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const filePath = path.join(dir, `${safeId}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(chat, null, 2), "utf-8");
    } catch (err) {
      // ignore transient fs errors
    }
  }

  public static loadChat(id: string): SavedChat | null {
    const dir = this.getDirectory();
    const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const filePath = path.join(dir, `${safeId}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static listChats(): ChatMetadata[] {
    const dir = this.getDirectory();
    if (!fs.existsSync(dir)) return [];
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
      const list: ChatMetadata[] = [];
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(dir, file), "utf-8");
          const parsed: SavedChat = JSON.parse(raw);
          const userMsgs = (parsed.messages || []).filter((m) => m.role === "user");
          const count = (parsed.messages || []).filter((m) => m.role !== "system").length;
          list.push({
            id: parsed.id,
            title: parsed.title || userMsgs[0]?.content?.slice(0, 50) || "Untitled Chat",
            createdAt: parsed.createdAt || new Date().toISOString(),
            updatedAt: parsed.updatedAt || parsed.createdAt || new Date().toISOString(),
            messageCount: count,
            model: parsed.model,
            mode: parsed.mode,
          });
        } catch {}
      }
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch {
      return [];
    }
  }

  public static deleteChat(id: string): boolean {
    const dir = this.getDirectory();
    const safeId = id.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const filePath = path.join(dir, `${safeId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
