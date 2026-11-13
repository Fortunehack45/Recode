import { test } from "node:test";
import assert from "node:assert/strict";
import { SwarmCoordinator } from "./coordinator.js";
import { MessageBoard } from "./message_board.js";

test("MessageBoard: correctly posts messages and publishes contracts", () => {
  const board = new MessageBoard();
  
  const msg = board.post("backend", "brief", "Starting auth endpoints", "frontend");
  assert.equal(msg.senderRole, "backend");
  assert.equal(msg.recipientRole, "frontend");
  assert.equal(msg.type, "brief");

  board.publishContract("user_schema", "type User = { id: string; name: string };", "backend");
  assert.equal(board.getContract("user_schema"), "type User = { id: string; name: string };");

  const contracts = board.allContracts();
  assert.ok(contracts.user_schema);
  assert.equal(contracts.user_schema.publisher, "backend");

  const frontendMessages = board.getMessages({ forRole: "frontend" });
  assert.equal(frontendMessages.length, 2); // 1 direct message + 1 broadcast contract
});

test("SwarmCoordinator: decomposes social media and 3D goal into dependency graph", () => {
  const coordinator = new SwarmCoordinator({ workspaceDir: process.cwd() });
  const slices = coordinator.decomposeGoal(
    "Build a multiplayer social media app with recommendation algorithm, 3D blender avatars, and cinematic higgsfield video promos"
  );

  assert.ok(slices.length >= 6);

  const backendTask = slices.find((s) => s.id === "task-backend");
  const algoTask = slices.find((s) => s.id === "task-algorithm");
  const gameTask = slices.find((s) => s.id === "task-game-3d");
  const mediaTask = slices.find((s) => s.id === "task-media");
  const frontendTask = slices.find((s) => s.id === "task-frontend");
  const devopsTask = slices.find((s) => s.id === "task-devops");
  const qaTask = slices.find((s) => s.id === "task-qa");

  assert.ok(backendTask);
  assert.ok(algoTask);
  assert.ok(gameTask);
  assert.ok(mediaTask);
  assert.ok(frontendTask);
  assert.ok(devopsTask);
  assert.ok(qaTask);

  // Invariant checks
  assert.deepEqual(backendTask.dependencies, []);
  assert.deepEqual(gameTask.dependencies, []);
  assert.deepEqual(mediaTask.dependencies, []);
  assert.ok(algoTask.dependencies.includes("task-backend"));
  assert.ok(frontendTask.dependencies.includes("task-backend"));
  assert.ok(frontendTask.dependencies.includes("task-game-3d"));
  assert.ok(frontendTask.dependencies.includes("task-media"));
  assert.ok(devopsTask.dependencies.includes("task-frontend"));
  assert.ok(qaTask.dependencies.includes("task-devops"));
});
