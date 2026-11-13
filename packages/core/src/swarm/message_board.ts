import { EventEmitter } from "node:events";
import { SwarmMessage, SwarmMessageType, SwarmRole } from "./types.js";

export class MessageBoard extends EventEmitter {
  private messages: SwarmMessage[] = [];
  private contracts: Map<string, { schema: string; publisher: SwarmRole; timestamp: number }> = new Map();

  post(
    senderRole: SwarmRole,
    type: SwarmMessageType,
    content: string,
    recipientRole: SwarmRole | "broadcast" = "broadcast",
    metadata?: Record<string, unknown>
  ): SwarmMessage {
    const message: SwarmMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      senderRole,
      recipientRole,
      type,
      content,
      metadata,
    };

    this.messages.push(message);
    this.emit("message", message);
    return message;
  }

  publishContract(key: string, schema: string, publisher: SwarmRole): void {
    this.contracts.set(key, { schema, publisher, timestamp: Date.now() });
    this.post(publisher, "contract", `Contract published: [${key}]`, "broadcast", { contractKey: key, schema });
    this.emit("contract", { key, schema, publisher });
  }

  getContract(key: string): string | undefined {
    return this.contracts.get(key)?.schema;
  }

  allContracts(): Record<string, { schema: string; publisher: SwarmRole; timestamp: number }> {
    return Object.fromEntries(this.contracts.entries());
  }

  getMessages(filter?: {
    forRole?: SwarmRole;
    fromRole?: SwarmRole;
    type?: SwarmMessageType;
  }): SwarmMessage[] {
    return this.messages.filter((msg) => {
      if (filter?.forRole && msg.recipientRole !== "broadcast" && msg.recipientRole !== filter.forRole) {
        return false;
      }
      if (filter?.fromRole && msg.senderRole !== filter.fromRole) {
        return false;
      }
      if (filter?.type && msg.type !== filter.type) {
        return false;
      }
      return true;
    });
  }

  clear(): void {
    this.messages = [];
    this.contracts.clear();
  }
}
