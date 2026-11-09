import { AuthStore } from "../auth/store.js";

export interface CollabMessage {
  type: "join" | "leave" | "message" | "event" | "ping" | "pong";
  roomId?: string;
  sender?: string;
  payload?: any;
  timestamp: string;
}

export class CollabClient {
  private serverUrl: string;
  private ws: any = null;
  private roomId: string | null = null;
  private username: string = "anonymous";

  constructor(serverUrl?: string) {
    const auth = AuthStore.load();
    this.serverUrl = serverUrl || auth.collab?.server_url || "wss://recode-collab.fly.dev";
    if (auth.github?.user?.login) {
      this.username = auth.github.user.login;
    }
  }

  public getStatus(): { connected: boolean; roomId: string | null; serverUrl: string } {
    return {
      connected: this.ws !== null && this.ws.readyState === 1,
      roomId: this.roomId,
      serverUrl: this.serverUrl,
    };
  }

  public async connect(roomId: string): Promise<boolean> {
    this.roomId = roomId;
    // In Node.js 22+, globalThis.WebSocket is natively available!
    if (typeof WebSocket === "undefined") {
      console.warn("[Collab] Native WebSocket not available in this Node runtime.");
      return false;
    }

    try {
      const url = `${this.serverUrl.replace(/^http/, "ws")}/rpc`;
      this.ws = new WebSocket(url);

      return await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.send({
            type: "join",
            roomId,
            sender: this.username,
            timestamp: new Date().toISOString(),
          });
          resolve(true);
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch {
      return false;
    }
  }

  public send(msg: CollabMessage): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public disconnect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
      this.roomId = null;
    }
  }
}
