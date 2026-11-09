import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";
import {
  Recode,
  Session,
  RecodeAuth,
  DEFAULT_MODELS,
  ModelInfo,
  resolveModel,
  getBestAvailableModel,
  PROVIDER_DEFAULT_MODELS,
} from "@recode/sdk";
import { UI } from "./ui.js";
import { c } from "./colors.js";

export interface ReplOptions {
  model?: string;
  workspaceDir?: string;
}

export class Repl {
  private recode: Recode;
  private session: Session;
  private currentModel: string;
  private workspaceDir: string;
  private running = true;

  constructor(options: ReplOptions = {}) {
    this.workspaceDir = options.workspaceDir || process.cwd();
    const status = RecodeAuth.status();

    // Determine initial model: options.model -> status.defaultModel -> best available configured key -> "(unconfigured)"
    const best = getBestAvailableModel(
      Object.fromEntries(Object.entries(status.providers).map(([k, v]) => [k, v.configured ? "set" : undefined]))
    );
    this.currentModel = options.model || status.defaultModel || (best ? best.id : "(unconfigured)");

    this.recode = new Recode({
      model: this.currentModel === "(unconfigured)" ? undefined : this.currentModel,
      workspaceDir: this.workspaceDir,
    });
    this.session = this.recode.createSession({
      model: this.currentModel === "(unconfigured)" ? undefined : this.currentModel,
      workspaceDir: this.workspaceDir,
    });
  }

  public async start(): Promise<void> {
    const rl = readline.createInterface({ input, output });

    console.clear();
    const status = this.recode.status();
    UI.printHeader(status, this.workspaceDir, this.currentModel);

    // If no provider key is configured, show onboarding connect card right away
    const hasAnyKey = Object.values(status.providers).some((p) => p.configured);
    if (!hasAnyKey) {
      UI.printConnectMenu();
    }

    while (this.running) {
      let line = "";
      try {
        const promptSymbol = c.cyan(c.bold("❯ "));
        line = await rl.question(promptSymbol);
      } catch {
        break;
      }

      line = line.trim();
      if (!line) continue;

      const parsed = this.parseCommand(line);
      if (parsed.isCommand) {
        await this.handleCommand(parsed.cmd, parsed.args, rl);
        continue;
      }

      // If user typed a regular prompt, verify a provider key is configured first
      if (!this.hasActiveKey()) {
        UI.printConnectMenu();
        console.log(
          c.yellow("! Please connect an AI provider first to chat with Recode.\n") +
          c.dim("  Example: ") + c.cyan("/connect gemini <your_key>") +
          c.dim(" or simply type ") + c.cyan("/connect") + c.dim(" for the interactive picker.\n")
        );
        continue;
      }

      await this.runTurn(line);
    }

    rl.close();
    console.log(c.dim("\nGoodbye from Recode Terminal."));
  }

  private hasActiveKey(): boolean {
    const status = this.recode.status();
    return Object.values(status.providers).some((p) => p.configured);
  }

  /**
   * Intelligently normalize input and check if it represents a command.
   * Strips leading ".\recode", "recode", or "/" so users can type:
   *   "models", "/models", ".\recode models", "recode models"
   *   "login", "/login", "auth login", ".\recode auth login"
   *   "connect", "/connect", "key ...", "set-key ..."
   */
  private parseCommand(raw: string): { isCommand: boolean; cmd: string; args: string[] } {
    let text = raw.trim();

    // Strip leading ".\recode ", "./recode ", or "recode "
    text = text.replace(/^(\.[\\\/])?recode\s+/i, "");

    // Strip leading "/"
    if (text.startsWith("/")) {
      text = text.substring(1).trim();
    }

    const tokens = text.split(/\s+/);
    const first = tokens[0]?.toLowerCase();

    // Handle "auth login", "auth logout", "auth status", "auth set-key"
    if (first === "auth") {
      const action = tokens[1]?.toLowerCase();
      if (action === "login") return { isCommand: true, cmd: "login", args: tokens.slice(2) };
      if (action === "logout") return { isCommand: true, cmd: "logout", args: tokens.slice(2) };
      if (action === "set-key") return { isCommand: true, cmd: "connect", args: tokens.slice(2) };
      return { isCommand: true, cmd: "auth", args: tokens.slice(1) };
    }

    const knownCommands = new Set([
      "help",
      "h",
      "?",
      "login",
      "logout",
      "connect",
      "key",
      "set-key",
      "model",
      "models",
      "diff",
      "status",
      "clear",
      "cls",
      "collab",
      "version",
      "v",
      "exit",
      "quit",
      "q",
    ]);

    if (first && knownCommands.has(first)) {
      return { isCommand: true, cmd: first, args: tokens.slice(1) };
    }

    return { isCommand: false, cmd: "", args: [] };
  }

  private async handleCommand(cmd: string, args: string[], rl: readline.Interface): Promise<void> {
    switch (cmd) {
      case "help":
      case "h":
      case "?":
        UI.printHelp();
        break;

      case "clear":
      case "cls":
        console.clear();
        this.session.reset();
        UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel);
        break;

      case "exit":
      case "quit":
      case "q":
        this.running = false;
        break;

      case "version":
      case "v":
        console.log(`recode v1.30.0\n`);
        break;

      case "models":
        UI.printModels(DEFAULT_MODELS, this.currentModel);
        break;

      case "model":
        if (args.length === 0) {
          console.log(`Current model: ${c.cyan(c.bold(this.currentModel))}\n`);
        } else {
          const modelName = args[0];
          const info = resolveModel(modelName);
          this.currentModel = info.id;
          this.session = this.recode.createSession({
            model: this.currentModel,
            workspaceDir: this.workspaceDir,
          });
          console.log(`✓ Switched model to ${c.cyan(c.bold(info.name))} ${c.dim(`(${info.id})`)}\n`);
        }
        break;

      case "connect":
      case "key":
      case "set-key":
        await this.handleConnect(args, rl);
        break;

      case "login":
        await this.handleLogin(rl);
        break;

      case "logout":
        RecodeAuth.logoutGitHub();
        console.log(c.green("✓ Logged out of GitHub.\n"));
        UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel);
        break;

      case "auth":
        this.printAuthStatus();
        break;

      case "diff":
        try {
          const diff = execSync("git diff --stat", { cwd: this.workspaceDir, encoding: "utf-8" });
          console.log(`\n${c.bold("Git Diff Summary:")}\n${diff || "No changes in working tree."}\n`);
        } catch {
          console.log(c.yellow("Git diff unavailable (not inside a Git repository).\n"));
        }
        break;

      case "status":
        try {
          const st = execSync("git status -s", { cwd: this.workspaceDir, encoding: "utf-8" });
          console.log(`\n${c.bold("Git Status:")}\n${st || "Working tree clean."}\n`);
        } catch {
          console.log(c.yellow("Git status unavailable.\n"));
        }
        break;

      case "collab":
        this.handleCollab(args);
        break;

      default:
        console.log(c.yellow(`Unknown command "${cmd}". Type /help for available commands.\n`));
    }
  }

  private async handleConnect(args: string[], rl: readline.Interface): Promise<void> {
    let provider = args[0]?.toLowerCase();
    let key = args.slice(1).join(" ").trim();

    // If no provider given, present an interactive choice
    if (!provider) {
      console.log(`\n${c.bold("Select an AI Provider to connect:")}`);
      console.log(`  1. Google Gemini   ${c.dim("(Recommended - 1M context, generous free tier)")}`);
      console.log(`  2. OpenAI          ${c.dim("(GPT-4o, o3-mini)")}`);
      console.log(`  3. Anthropic       ${c.dim("(Claude 3.7 / 3.5 Sonnet)")}`);
      console.log(`  4. DeepSeek        ${c.dim("(DeepSeek V3, DeepSeek R1)")}`);
      console.log(`  5. Groq            ${c.dim("(Llama 3.3 70B - ultra fast)")}`);
      console.log(`  6. Local Ollama    ${c.dim("(100% Free & offline local AI)")}`);
      console.log(`  0. Cancel\n`);

      const choice = (await rl.question(c.cyan("Select [1-6]: "))).trim();
      const choiceMap: Record<string, string> = {
        "1": "gemini",
        "2": "openai",
        "3": "anthropic",
        "4": "deepseek",
        "5": "groq",
        "6": "ollama",
      };

      provider = choiceMap[choice];
      if (!provider) {
        console.log(c.yellow("Connect cancelled.\n"));
        return;
      }
    }

    if (provider === "ollama") {
      this.currentModel = "ollama-local";
      this.session = this.recode.createSession({
        model: this.currentModel,
        workspaceDir: this.workspaceDir,
      });
      console.log(c.green(`\n✓ Configured local Ollama! Active model set to ollama-local.\n`));
      UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel);
      return;
    }

    // Prompt for key if not passed inline
    if (!key) {
      key = (await rl.question(c.cyan(`Enter API key for ${provider.toUpperCase()}: `))).trim();
      if (!key) {
        console.log(c.yellow("No key entered. Cancelled.\n"));
        return;
      }
    }

    RecodeAuth.setApiKey(provider, key);
    const targetModel = PROVIDER_DEFAULT_MODELS[provider] || "gemini-2.5-flash";
    this.currentModel = targetModel;
    this.session = this.recode.createSession({
      model: this.currentModel,
      workspaceDir: this.workspaceDir,
    });

    console.log(c.green(`\n✓ Stored API key for ${provider.toUpperCase()}!`));
    console.log(c.green(`✓ Active model automatically set to ${c.bold(this.currentModel)}.\n`));
    UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel);
  }

  private async handleLogin(rl: readline.Interface): Promise<void> {
    console.log(c.dim("\nInitiating GitHub Device Authorization..."));

    try {
      const auth = await RecodeAuth.loginWithGitHubDeviceCode(
        (deviceAuth) => {
          // Safely copy to clipboard
          try {
            if (process.platform === "win32") {
              execSync(`powershell -Command "Set-Clipboard -Value '${deviceAuth.user_code}'"`, { stdio: "ignore" });
            } else if (process.platform === "darwin") {
              execSync("pbcopy", { input: deviceAuth.user_code, stdio: ["pipe", "ignore", "ignore"] });
            }
          } catch {}

          // Try to launch default browser
          try {
            if (process.platform === "win32") {
              execSync(`start ${deviceAuth.verification_uri}`, { stdio: "ignore" });
            } else if (process.platform === "darwin") {
              execSync(`open ${deviceAuth.verification_uri}`, { stdio: "ignore" });
            } else {
              execSync(`xdg-open ${deviceAuth.verification_uri}`, { stdio: "ignore" });
            }
          } catch {}

          UI.printDeviceAuthCard(deviceAuth.user_code, deviceAuth.verification_uri);
        },
        () => {
          process.stdout.write(c.dim("."));
        }
      );

      UI.printDeviceAuthSuccess(auth.user.login);
      UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel);
    } catch (err: any) {
      console.log(c.red(`\n✗ GitHub Login Failed: ${err.message}\n`));
    }
  }

  private printAuthStatus(): void {
    const status = this.recode.status();
    console.log(`\n${c.bold("Authentication Status:")}`);
    if (status.github) {
      console.log(`  ${c.green("GitHub:")} @${status.github.username} (connected)`);
    } else {
      console.log(`  ${c.yellow("GitHub:")} Not connected (run /login to connect)`);
    }

    console.log(`\n${c.bold("Configured Provider Keys:")}`);
    for (const [p, info] of Object.entries(status.providers)) {
      const mark = info.configured ? c.green("✓ Configured") : c.dim("Not set");
      console.log(`  ${p.padEnd(14)}: ${mark} ${c.dim(`(${info.maskedKey})`)}`);
    }
    console.log(`\n  Default Model: ${c.cyan(c.bold(this.currentModel))}\n`);
  }

  private handleCollab(args: string[]): void {
    console.log(`\n${c.bold("Recode Collaboration Service:")}`);
    console.log(`  Server: ${c.cyan("wss://recode-collab.fly.dev")}`);
    console.log(`  Status: ${c.green("● Online")}`);
    if (args[0]) {
      console.log(`  Room  : ${c.bold(args[0])}`);
    }
    console.log(`  ${c.dim("Real-time CRDT room channels active on Fly.io.")}\n`);
  }

  private async runTurn(userPrompt: string): Promise<void> {
    const abortController = new AbortController();

    const onSigInt = () => {
      console.log(c.yellow("\n[Interrupted by user]"));
      abortController.abort();
    };

    process.once("SIGINT", onSigInt);

    try {
      console.log();
      for await (const event of this.session.prompt(userPrompt, { signal: abortController.signal })) {
        if (event.type === "token" && event.content) {
          process.stdout.write(event.content);
        } else if (event.type === "tool_start" && event.toolCall) {
          UI.printToolStart(event.toolCall.name, event.toolCall.arguments);
        } else if (event.type === "tool_end" && event.toolCall && event.toolResult) {
          UI.printToolEnd(
            event.toolCall.name,
            event.toolResult.success,
            event.toolResult.output,
            event.toolResult.error
          );
        } else if (event.type === "error") {
          console.log(`\n${c.red("Error:")} ${event.error}`);
        }
      }
      console.log("\n");
    } catch (err: any) {
      console.log(`\n${c.red("Execution error:")} ${err.message}\n`);
    } finally {
      process.removeListener("SIGINT", onSigInt);
    }
  }
}
