/**
 * Blender Application & Runtime Detector
 * 
 * Inspects system paths for installed Blender versions, validates compatibility
 * for the official Blender Lab MCP server (Blender 5.1+), and locates extensions.
 */

import fs from "node:fs";
import path from "node:path";
import { exec as cpExec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(cpExec);

export interface BlenderInstallationInfo {
  installed: boolean;
  executablePath?: string;
  version?: string;
  majorVersion?: number;
  minorVersion?: number;
  supportsBlenderLabMcp: boolean; // Requires 5.1+
  supportsRecodeBridge: boolean;   // Requires 3.6+
  labExtensionInstalled?: boolean;
}

export class BlenderDetector {
  /**
   * Discovers installed Blender executable across operating systems
   */
  public static async detect(): Promise<BlenderInstallationInfo> {
    const candidatePaths = this.getStandardCandidatePaths();

    for (const binPath of candidatePaths) {
      if (fs.existsSync(binPath)) {
        return this.inspectExecutable(binPath);
      }
    }

    // Try detecting from PATH
    try {
      const isWin = process.platform === "win32";
      const whichCmd = isWin ? "where blender" : "which blender";
      const { stdout } = await execAsync(whichCmd);
      const firstLine = stdout.trim().split("\n")[0].trim();
      if (firstLine && fs.existsSync(firstLine)) {
        return this.inspectExecutable(firstLine);
      }
    } catch {
      // Not on PATH
    }

    return {
      installed: false,
      supportsBlenderLabMcp: false,
      supportsRecodeBridge: false,
    };
  }

  private static getStandardCandidatePaths(): string[] {
    const paths: string[] = [];
    const platform = process.platform;

    if (platform === "win32") {
      const progFiles = process.env["ProgramFiles"] || "C:\\Program Files";
      const baseDir = path.join(progFiles, "Blender Foundation");
      if (fs.existsSync(baseDir)) {
        try {
          const entries = fs.readdirSync(baseDir);
          // Look for newest version first
          entries.sort().reverse();
          for (const entry of entries) {
            paths.push(path.join(baseDir, entry, "blender.exe"));
          }
        } catch {}
      }
      paths.push("C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe");
      paths.push("C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe");
      paths.push("C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe");
      paths.push("C:\\Program Files\\Blender Foundation\\Blender 3.6\\blender.exe");
    } else if (platform === "darwin") {
      paths.push("/Applications/Blender.app/Contents/MacOS/Blender");
      paths.push("/Applications/Blender 5.1.app/Contents/MacOS/Blender");
    } else {
      paths.push("/usr/bin/blender");
      paths.push("/usr/local/bin/blender");
      paths.push("/snap/bin/blender");
    }

    return paths;
  }

  private static async inspectExecutable(binPath: string): Promise<BlenderInstallationInfo> {
    try {
      const { stdout } = await execAsync(`"${binPath}" --version`);
      // Typical output: "Blender 5.1.0\nbuild date: ..."
      const match = stdout.match(/Blender\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const fullVersion = `${major}.${minor}${match[3] ? `.${match[3]}` : ""}`;

        const supportsLab = major > 5 || (major === 5 && minor >= 1);
        const supportsBridge = major > 3 || (major === 3 && minor >= 6);

        return {
          installed: true,
          executablePath: binPath,
          version: fullVersion,
          majorVersion: major,
          minorVersion: minor,
          supportsBlenderLabMcp: supportsLab,
          supportsRecodeBridge: supportsBridge,
          labExtensionInstalled: false, // Can be checked against Blender addon directory
        };
      }
    } catch {
      // Executable found but execution failed
    }

    return {
      installed: true,
      executablePath: binPath,
      supportsBlenderLabMcp: false,
      supportsRecodeBridge: true,
    };
  }
}
