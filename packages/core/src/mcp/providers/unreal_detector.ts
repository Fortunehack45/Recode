/**
 * Epic Games Unreal Engine Detector & Process Inspector
 * 
 * Inspects system paths and active processes for Unreal Engine 5 Editor instances,
 * discovers project paths, and resolves the embedded MCP HTTP endpoint.
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(cpExec);

export interface UnrealEditorSession {
  isRunning: boolean;
  processId?: number;
  engineVersion?: string;
  projectPath?: string;
  projectName?: string;
  embeddedMcpEndpoint?: string;
  webRemoteControlEndpoint?: string;
  embeddedMcpAvailable?: boolean;
}

export class UnrealDetector {
  /**
   * Scans active processes to locate running Unreal Editor and active projects
   */
  public static async detectRunningEditor(): Promise<UnrealEditorSession> {
    const isWin = process.platform === "win32";

    try {
      if (isWin) {
        // Look for UnrealEditor.exe in process list
        const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq UnrealEditor.exe" /FO CSV /NH');
        if (stdout.includes("UnrealEditor.exe")) {
          // Parse PID
          const match = stdout.match(/"UnrealEditor\.exe","(\d+)"/i);
          const pid = match ? parseInt(match[1], 10) : undefined;

          // Probe for Epic official embedded MCP endpoint and Web Remote Control
          const mcpProbe = await this.probePort(8080);
          const rmtProbe = await this.probePort(30010);

          return {
            isRunning: true,
            processId: pid,
            embeddedMcpEndpoint: mcpProbe ? "http://127.0.0.1:8080" : undefined,
            webRemoteControlEndpoint: rmtProbe ? "http://127.0.0.1:30010" : undefined,
            embeddedMcpAvailable: mcpProbe,
          };
        }
      } else {
        const { stdout } = await execAsync("pgrep -l UnrealEditor || true");
        if (stdout.trim().length > 0) {
          const mcpProbe = await this.probePort(8080);
          const rmtProbe = await this.probePort(30010);

          return {
            isRunning: true,
            embeddedMcpEndpoint: mcpProbe ? "http://127.0.0.1:8080" : undefined,
            webRemoteControlEndpoint: rmtProbe ? "http://127.0.0.1:30010" : undefined,
            embeddedMcpAvailable: mcpProbe,
          };
        }
      }
    } catch {
      // Process probe failed
    }

    return {
      isRunning: false,
      embeddedMcpAvailable: false,
    };
  }

  /**
   * Check if a local port responds
   */
  private static async probePort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/",
          method: "GET",
          timeout: 800,
        },
        (res) => {
          resolve(res.statusCode !== undefined);
        }
      );

      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  }

  /**
   * Find installed Unreal Engine versions on system
   */
  public static findInstalledEngines(): string[] {
    const installed: string[] = [];
    const isWin = process.platform === "win32";

    if (isWin) {
      const progFiles = process.env["ProgramFiles"] || "C:\\Program Files";
      const epicDir = path.join(progFiles, "Epic Games");
      if (fs.existsSync(epicDir)) {
        try {
          const entries = fs.readdirSync(epicDir);
          for (const entry of entries) {
            if (entry.startsWith("UE_")) {
              installed.push(path.join(epicDir, entry));
            }
          }
        } catch {}
      }
    } else if (process.platform === "darwin") {
      const sharedEpic = "/Users/Shared/Epic Games";
      if (fs.existsSync(sharedEpic)) {
        try {
          const entries = fs.readdirSync(sharedEpic);
          for (const entry of entries) {
            if (entry.startsWith("UE_")) {
              installed.push(path.join(sharedEpic, entry));
            }
          }
        } catch {}
      }
    }

    return installed;
  }
}
