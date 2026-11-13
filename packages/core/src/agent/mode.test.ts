import { test } from "node:test";
import assert from "node:assert/strict";
import { Agent } from "./loop.js";

test("Agent Modes: defaults to normal mode", () => {
  const agent = new Agent();
  assert.equal(agent.getMode(), "normal");
});

test("Agent Modes: /plan activates plan mode with user review & approval constraint", async () => {
  const agent = new Agent({ maxTurns: 1 });
  assert.equal(agent.getMode(), "normal");

  // Dispatch /plan command
  const generator = agent.prompt("/plan design real-time feed architecture");
  const firstEvent = await generator.next();
  assert.ok(firstEvent.value && typeof firstEvent.value === "object");
  const event = firstEvent.value as any;
  assert.equal(event.type, "start");
  assert.ok(event.content?.includes("[MODE: PLAN]"));
  assert.ok(event.content?.includes("Present the plan for user review and approval before touching or modifying any code."));
  assert.equal(agent.getMode(), "plan");
});

test("Agent Modes: /agent activates autonomous multi-agent swarm mode", async () => {
  const agent = new Agent({ maxTurns: 1 });
  assert.equal(agent.getMode(), "normal");

  // Dispatch /agent command
  const generator = agent.prompt("/agent build social media app with 3D avatars");
  const firstEvent = await generator.next();
  assert.ok(firstEvent.value && typeof firstEvent.value === "object");
  const event = firstEvent.value as any;
  assert.equal(event.type, "start");
  assert.ok(event.content?.includes("[MODE: AGENT]"));
  assert.ok(event.content?.includes("Autonomous Multi-Agent Swarm"));
  assert.equal(agent.getMode(), "agent");
});

test("Agent Modes: /normal restores normal mode", async () => {
  const agent = new Agent({ mode: "agent" });
  assert.equal(agent.getMode(), "agent");

  const generator = agent.prompt("/normal");
  let finalContent = "";
  for await (const event of generator) {
    if (event.type === "turn_complete") {
      finalContent = event.content || "";
    }
  }

  assert.equal(agent.getMode(), "normal");
  assert.ok(finalContent.includes("Switched to Normal Mode"));
});
