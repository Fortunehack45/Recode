import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ChatStore, SavedChat } from "./chat_store.js";

test("ChatStore saves, lists, loads, and deletes chat sessions", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "recode-chats-test-"));
  ChatStore.setCustomDir(tmpDir);

  try {
    const mockChat1: SavedChat = {
      id: "session_test_1",
      title: "First user conversation",
      createdAt: new Date(Date.now() - 10000).toISOString(),
      updatedAt: new Date(Date.now() - 5000).toISOString(),
      model: "opencode-zen",
      mode: "build",
      messages: [
        { role: "user", content: "Hello agent" },
        { role: "assistant", content: "Hello! How can I help?" },
      ],
    };

    const mockChat2: SavedChat = {
      id: "session_test_2",
      title: "Second user conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: "gemini-2.5-flash",
      mode: "plan",
      messages: [
        { role: "user", content: "Plan architecture" },
        { role: "assistant", content: "Here is the architectural plan" },
      ],
    };

    // Save
    ChatStore.saveChat(mockChat1);
    ChatStore.saveChat(mockChat2);

    // List
    const list = ChatStore.listChats();
    assert.equal(list.length, 2);
    assert.equal(list[0].id, "session_test_2"); // newest first
    assert.equal(list[1].id, "session_test_1");
    assert.equal(list[0].messageCount, 2);

    // Load
    const loaded = ChatStore.loadChat("session_test_1");
    assert.ok(loaded);
    assert.equal(loaded?.title, "First user conversation");
    assert.equal(loaded?.messages.length, 2);
    assert.equal(loaded?.model, "opencode-zen");

    // Delete
    const deleted = ChatStore.deleteChat("session_test_1");
    assert.equal(deleted, true);
    assert.equal(ChatStore.listChats().length, 1);
    assert.equal(ChatStore.loadChat("session_test_1"), null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ChatStore.setCustomDir(null as any);
  }
});
