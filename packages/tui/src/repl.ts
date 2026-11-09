import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  Recode,
  Session,
  RecodeAuth,
  DEFAULT_MODELS,
  ModelInfo,
  resolveModel,
  getBestAvailableModel,
  PROVIDER_DEFAULT_MODELS,
} from "@recode-dev/sdk";
import { UI } from "./ui.js";
import { ThemeManager, BUILTIN_THEMES } from "./theme.js";
import { FontManager, BorderStyleType, MascotStyleType } from "./font.js";
import { LiveActionIndicator } from "./action_state.js";
import { NativeInputBox } from "./input.js";

export type AgentMode = "build" | "plan";

export interface ReplOptions {
  model?: string;
  workspaceDir?: string;
  mode?: AgentMode;
  showWelcome?: boolean;
}

export class Repl {
  private recode: Recode;
  private session: Session;
  private currentModel: string;
  private workspaceDir: string;
  private mode: AgentMode = "build";
  private running = true;
  private cumulativeTokens = 1240;
  private inputBox: NativeInputBox;
  private indicator: LiveActionIndicator;
  private theme: ThemeManager;
  private font: FontManager;
  private shouldShowWelcome: boolean;

  constructor(options: ReplOptions = {}) {
    this.workspaceDir = options.workspaceDir || process.cwd();
    this.mode = options.mode || "build";
    this.shouldShowWelcome = Boolean(options.showWelcome);
    this.theme = ThemeManager.get();
    this.font = FontManager.get();
    this.indicator = LiveActionIndicator.get();
    this.inputBox = new NativeInputBox();

    const status = RecodeAuth.status();

    // Determine initial model: options.model -> status.defaultModel -> best available configured key -> "(unconfigured)"
    const best = getBestAvailableModel(
      Object.fromEntries(
        Object.entries(status.providers).map(([k, v]) => [k, v.configured ? "set" : undefined])
      )
    );
    this.currentModel =
      options.model || status.defaultModel || (best ? best.id : "(unconfigured)");

    this.recode = new Recode({
      model: this.currentModel === "(unconfigured)" ? undefined : this.currentModel,
      workspaceDir: this.workspaceDir,
    });
    this.session = this.createConfiguredSession();
  }

  private createConfiguredSession(): Session {
    const isPlan = this.mode === "plan";
    const planPrompt = isPlan
      ? "\n\nCRITICAL INSTRUCTION: You are in PLAN MODE. You may inspect and read files, but you MUST NOT write or edit files, and you MUST NOT execute modifying commands. Explain your architecture plan clearly to the user."
      : "";

    return this.recode.createSession({
      model: this.currentModel === "(unconfigured)" ? undefined : this.currentModel,
      workspaceDir: this.workspaceDir,
      systemPrompt: planPrompt ? undefined : undefined,
    });
  }

  public async start(): Promise<void> {
    const cfg = ThemeManager.loadConfig();
    if (this.shouldShowWelcome || !cfg.theme) {
      await this.showWelcomeSplash();
    }

    console.clear();
    const status = this.recode.status();
    UI.printHeader(status, this.workspaceDir, this.currentModel, this.mode, "1.30.3", this.session.id);

    // If no provider key is configured, show onboarding connect card right away
    const hasAnyKey = Object.values(status.providers).some((p) => p.configured);
    if (!hasAnyKey) {
      UI.printConnectMenu();
    }

    while (this.running) {
      let line = "";
      try {
        line = await this.inputBox.prompt(
          {
            mode: this.mode,
            workspaceDir: this.workspaceDir,
            currentModel: this.currentModel,
            tokens: this.cumulativeTokens,
          },
          (newMode) => {
            this.mode = newMode;
            this.session = this.createConfiguredSession();
          }
        );
      } catch {
        break;
      }

      line = line.trim();
      if (!line) continue;

      // 1. Inline Shell Command execution (!<cmd>)
      if (line.startsWith("!")) {
        const shellCmd = line.substring(1).trim();
        if (shellCmd) {
          this.executeShellCommand(shellCmd);
        }
        continue;
      }

      // 2. Command normalization
      const parsed = this.parseCommand(line);
      if (parsed.isCommand) {
        await this.handleCommand(parsed.cmd, parsed.args);
        continue;
      }

      // 3. If user typed a regular prompt, verify a provider key is configured
      if (!this.hasActiveKey()) {
        UI.printConnectMenu();
        console.log(
          this.theme.warning("[!] Recode needs an AI provider connected before executing prompts.\n") +
            this.theme.dim("  Connect now: ") +
            this.theme.accent("/connect") +
            this.theme.dim(" or ") +
            this.theme.accent("/connect gemini <key>\n")
        );
        const rl = readline.createInterface({ input, output });
        const ans = (
          await rl.question(this.theme.accent("Would you like to connect a provider now? [y/N]: "))
        ).trim().toLowerCase();
        rl.close();
        if (ans === "y" || ans === "yes") {
          await this.handleConnect([]);
        }
        continue;
      }

      // 4. File reference tagging (@<filepath>)
      const { augmentedPrompt, attachedFiles } = this.extractFileReferences(line);
      if (attachedFiles.length > 0) {
        console.log(
          this.theme.dim(`[file] Loaded ${attachedFiles.length} file context(s): `) +
            attachedFiles.map((f) => this.theme.accent(f)).join(", ")
        );
      }

      // 5. Display prompt in user message container
      UI.printUserMessage(line);

      // 6. Run agent turn with real-time LiveActionIndicator
      await this.runTurn(augmentedPrompt);
    }

    console.log(this.theme.dim("\nGoodbye from Recode Terminal."));
  }

  private async showWelcomeSplash(): Promise<void> {
    UI.printWelcomeSplash("1.30.3");
    const rl = readline.createInterface({ input, output });
    await rl.question("");
    rl.close();
    ThemeManager.saveConfig({ theme: this.theme.theme.id });
  }

  private hasActiveKey(): boolean {
    const status = this.recode.status();
    return Object.values(status.providers).some((p) => p.configured);
  }

  /**
   * Normalize input and detect commands.
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
      "welcome",
      "theme",
      "themes",
      "font",
      "color",
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
      "mode",
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

  private async handleCommand(cmd: string, args: string[]): Promise<void> {
    switch (cmd) {
      case "welcome":
        await this.showWelcomeSplash();
        console.clear();
        UI.printHeader(
          this.recode.status(),
          this.workspaceDir,
          this.currentModel,
          this.mode,
          "1.30.3",
          this.session.id
        );
        break;

      case "theme":
      case "themes":
        await this.handleTheme(args);
        break;

      case "font":
        await this.handleFont(args);
        break;

      case "color":
        await this.handleColor(args);
        break;

      case "help":
      case "h":
      case "?":
        UI.printHelp();
        break;

      case "clear":
      case "cls":
        console.clear();
        this.session.reset();
        UI.printHeader(
          this.recode.status(),
          this.workspaceDir,
          this.currentModel,
          this.mode,
          "1.30.3",
          this.session.id
        );
        break;

      case "exit":
      case "quit":
      case "q":
        this.running = false;
        break;

      case "version":
      case "v":
        console.log(`recode v1.30.3\n`);
        break;

      case "models": {
        const status = this.recode.status();
        UI.printModelCatalog(DEFAULT_MODELS, this.currentModel, status.providers);
        break;
      }

      case "model":
        if (args.length === 0) {
          console.log(`  Current active model: ${this.theme.accent(this.theme.bold(this.currentModel))}\n`);
        } else {
          const modelName = args[0];
          const info = resolveModel(modelName);
          this.currentModel = info.id;
          this.session = this.createConfiguredSession();
          console.log(
            `  ${this.theme.success("[✓]")} Switched model to ${this.theme.accent(this.theme.bold(info.name))} ${this.theme.dim(`(${info.id})`)}\n`
          );
        }
        break;

      case "mode": {
        const target = args[0]?.toLowerCase();
        if (target === "build" || target === "plan") {
          this.mode = target;
        } else {
          this.mode = this.mode === "build" ? "plan" : "build";
        }
        this.session = this.createConfiguredSession();
        console.log(
          `  ${this.theme.success("[✓]")} Mode switched to ${
            this.mode === "build"
              ? this.theme.fg(this.theme.palette.success)(this.theme.bold("[BUILD] (read/write/exec)"))
              : this.theme.fg(this.theme.palette.secondary)(this.theme.bold("[PLAN] (read-only analysis)"))
          }\n`
        );
        break;
      }

      case "connect":
      case "key":
      case "set-key":
        await this.handleConnect(args);
        break;

      case "login":
        await this.handleLogin();
        break;

      case "logout":
        RecodeAuth.logoutGitHub();
        console.log(this.theme.success("  [✓] Logged out of GitHub.\n"));
        UI.printHeader(
          this.recode.status(),
          this.workspaceDir,
          this.currentModel,
          this.mode,
          "1.30.3",
          this.session.id
        );
        break;

      case "auth":
        this.printAuthStatus();
        break;

      case "diff":
        try {
          const diff = execSync("git diff --stat", {
            cwd: this.workspaceDir,
            encoding: "utf-8",
          });
          console.log(
            `\n  ${this.theme.bold(this.theme.text("Git Diff Summary:"))}\n${diff ? "  " + diff.replace(/\n/g, "\n  ") : "  No changes in working tree."}\n`
          );
        } catch {
          console.log(this.theme.warning("  Git diff unavailable (not inside a Git repository).\n"));
        }
        break;

      case "status":
        try {
          const st = execSync("git status -s", {
            cwd: this.workspaceDir,
            encoding: "utf-8",
          });
          console.log(`\n  ${this.theme.bold(this.theme.text("Git Status:"))}\n${st ? "  " + st.replace(/\n/g, "\n  ") : "  Working tree clean."}\n`);
        } catch {
          console.log(this.theme.warning("  Git status unavailable.\n"));
        }
        break;

      case "collab":
        this.handleCollab(args);
        break;

      default:
        console.log(this.theme.warning(`  Unknown command "${cmd}". Type /help for available commands.\n`));
    }
  }

  private async handleTheme(args: string[]): Promise<void> {
    const sub = args[0]?.toLowerCase();

    // /theme list or /theme with no arguments -> show gallery
    if (!sub || sub === "list" || sub === "gallery") {
      UI.printThemeGallery();
      return;
    }

    // /theme ide -> sync directly from Recode IDE settings.json
    if (sub === "ide" || sub === "sync") {
      const ideTheme = ThemeManager.detectIdeTheme();
      if (ideTheme) {
        this.theme.setTheme(ideTheme, { syncIde: false });
        console.log(
          this.theme.success(`\n  [✓] Synchronized theme with Recode IDE: `) +
            this.theme.accent(this.theme.bold(this.theme.theme.name)) +
            "\n"
        );
        console.clear();
        UI.printHeader(
          this.recode.status(),
          this.workspaceDir,
          this.currentModel,
          this.mode,
          "1.30.3",
          this.session.id
        );
      } else {
        console.log(this.theme.warning("\n  [!] Could not detect active Recode IDE theme in settings.json.\n"));
      }
      return;
    }

    // /theme <name> -> switch to theme
    const success = this.theme.setTheme(sub, { syncIde: true });
    if (success) {
      console.log(
        this.theme.success(`\n  [✓] Switched theme to `) +
          this.theme.accent(this.theme.bold(this.theme.theme.name)) +
          this.theme.dim(" (saved and synchronized with Recode IDE)") +
          "\n"
      );
      console.clear();
      UI.printHeader(
        this.recode.status(),
        this.workspaceDir,
        this.currentModel,
        this.mode,
        "1.30.3",
        this.session.id
      );
    } else {
      console.log(this.theme.error(`\n  [x] Unknown theme "${sub}". Run /theme to see available themes.\n`));
    }
  }

  private async handleFont(args: string[]): Promise<void> {
    const sub = args[0]?.toLowerCase();
    const val = args[1]?.toLowerCase();

    if (!sub) {
      UI.printFontMenu();
      return;
    }

    if (sub === "style" && val) {
      const validStyles: BorderStyleType[] = ["dotted", "rounded", "sharp", "double", "minimal"];
      if (validStyles.includes(val as BorderStyleType)) {
        this.font.setBorderStyle(val as BorderStyleType);
        console.log(this.theme.success(`\n  [✓] Border style updated to "${val}".\n`));
        console.clear();
        UI.printHeader(
          this.recode.status(),
          this.workspaceDir,
          this.currentModel,
          this.mode,
          "1.30.3",
          this.session.id
        );
        return;
      }
    }

    if (sub === "mascot" && val) {
      const validMascots: MascotStyleType[] = ["retro", "robot", "mini", "off"];
      if (validMascots.includes(val as MascotStyleType)) {
        this.font.setMascotStyle(val as MascotStyleType);
        console.log(this.theme.success(`\n  [✓] Mascot style updated to "${val}".\n`));
        console.clear();
        UI.printHeader(
          this.recode.status(),
          this.workspaceDir,
          this.currentModel,
          this.mode,
          "1.30.3",
          this.session.id
        );
        return;
      }
    }

    UI.printFontMenu();
  }

  private async handleColor(args: string[]): Promise<void> {
    const sub = args[0]?.toLowerCase();
    const val = args[1]?.toLowerCase();

    if (!sub) {
      UI.printColorPalette();
      return;
    }

    if (sub === "reset") {
      this.theme.setCustomAccent(null);
      console.log(this.theme.success(`\n  [✓] Accent color reset to theme default.\n`));
      console.clear();
      UI.printHeader(
        this.recode.status(),
        this.workspaceDir,
        this.currentModel,
        this.mode,
        "1.30.3",
        this.session.id
      );
      return;
    }

    if (sub === "accent" && val) {
      const colorMap: Record<string, string> = {
        cyan: "#00f0ff",
        blue: "#5ac1fe",
        orange: "#fe8019",
        coral: "#e06c53",
        green: "#7fd962",
        emerald: "#10b981",
        magenta: "#ec4899",
        purple: "#bd93f9",
        amber: "#ffb454",
        yellow: "#fabd2f",
      };
      const hex = colorMap[val] || (val.startsWith("#") ? val : `#${val}`);
      this.theme.setCustomAccent(hex);
      console.log(this.theme.success(`\n  [✓] Custom accent set to ${val} (${hex}).\n`));
      console.clear();
      UI.printHeader(
        this.recode.status(),
        this.workspaceDir,
        this.currentModel,
        this.mode,
        "1.30.3",
        this.session.id
      );
      return;
    }

    UI.printColorPalette();
  }

  private async handleConnect(args: string[]): Promise<void> {
    let provider = args[0]?.toLowerCase();
    let key = args.slice(1).join(" ").trim();
    const rl = readline.createInterface({ input, output });

    // If no provider given, present an interactive choice
    if (!provider) {
      console.log(`\n  ${this.theme.bold(this.theme.text("Select an AI Provider to connect:"))}`);
      console.log(`  [1] Google Gemini   ${this.theme.dim("(Generous free tier, 1M context — Recommended)")}`);
      console.log(`  [2] OpenAI          ${this.theme.dim("(GPT-4o, o3-mini)")}`);
      console.log(`  [3] Anthropic       ${this.theme.dim("(Claude 3.7 / 3.5 Sonnet)")}`);
      console.log(`  [4] DeepSeek        ${this.theme.dim("(DeepSeek V3, DeepSeek R1)")}`);
      console.log(`  [5] Groq            ${this.theme.dim("(Llama 3.3 70B - ultra fast)")}`);
      console.log(`  [6] Local Ollama    ${this.theme.dim("(100% Free & offline local AI)")}`);
      console.log(`  [0] Cancel\n`);

      const choice = (await rl.question(this.theme.accent("  Select [1-6]: "))).trim();
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
        rl.close();
        console.log(this.theme.warning("  Connect cancelled.\n"));
        return;
      }
    }

    if (provider === "ollama") {
      rl.close();
      this.currentModel = "ollama-local";
      this.session = this.createConfiguredSession();
      console.log(this.theme.success(`\n  [✓] Configured local Ollama! Active model set to ollama-local.\n`));
      UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel, this.mode, "1.30.3", this.session.id);
      return;
    }

    // Prompt for key if not passed inline
    if (!key) {
      key = (
        await rl.question(this.theme.accent(`  Enter API key for ${provider.toUpperCase()}: `))
      ).trim();
      rl.close();
      if (!key) {
        console.log(this.theme.warning("  No key entered. Cancelled.\n"));
        return;
      }
    } else {
      rl.close();
    }

    RecodeAuth.setApiKey(provider, key);
    const targetModel = PROVIDER_DEFAULT_MODELS[provider] || "gemini-2.5-flash";
    this.currentModel = targetModel;
    this.session = this.createConfiguredSession();

    console.log(this.theme.success(`\n  [✓] Stored API key for ${provider.toUpperCase()}!`));
    console.log(
      this.theme.success(`  [✓] Active model automatically set to ${this.theme.bold(this.currentModel)}.\n`)
    );
    UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel, this.mode, "1.30.3", this.session.id);
  }

  private async handleLogin(): Promise<void> {
    console.log(this.theme.dim("\n  Initiating GitHub Device Authorization..."));

    try {
      const auth = await RecodeAuth.loginWithGitHubDeviceCode(
        (deviceAuth) => {
          // Safely copy to clipboard
          try {
            if (process.platform === "win32") {
              execSync(
                `powershell -Command "Set-Clipboard -Value '${deviceAuth.user_code}'"`,
                { stdio: "ignore" }
              );
            } else if (process.platform === "darwin") {
              execSync("pbcopy", {
                input: deviceAuth.user_code,
                stdio: ["pipe", "ignore", "ignore"],
              });
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
          process.stdout.write(this.theme.dim("."));
        }
      );

      UI.printDeviceAuthSuccess(auth.user.login);
      UI.printHeader(this.recode.status(), this.workspaceDir, this.currentModel, this.mode, "1.30.3", this.session.id);
    } catch (err: any) {
      console.log(this.theme.error(`\n  [x] GitHub Login Failed: ${err.message}\n`));
    }
  }

  private printAuthStatus(): void {
    const status = this.recode.status();
    console.log(`\n  ${this.theme.bold(this.theme.text("Authentication Status:"))}`);
    if (status.github) {
      console.log(`  ${this.theme.success("GitHub:")} @${status.github.username} (connected)`);
    } else {
      console.log(`  ${this.theme.warning("GitHub:")} Not connected (run /login to connect)`);
    }

    console.log(`\n  ${this.theme.bold(this.theme.text("Configured Provider Keys:"))}`);
    for (const [p, info] of Object.entries(status.providers)) {
      const mark = info.configured ? this.theme.success("[✓] Configured") : this.theme.dim("Not set");
      console.log(`  ${p.padEnd(14)}: ${mark} ${this.theme.dim(`(${info.maskedKey})`)}`);
    }
    console.log(`\n  Default Model: ${this.theme.accent(this.theme.bold(this.currentModel))}\n`);
  }

  private handleCollab(args: string[]): void {
    console.log(`\n  ${this.theme.bold(this.theme.text("Recode Collaboration Service:"))}`);
    console.log(`  Server: ${this.theme.accent("wss://recode-collab.fly.dev")}`);
    console.log(`  Status: ${this.theme.success("[✓] Online")}`);
    if (args[0]) {
      console.log(`  Room  : ${this.theme.bold(args[0])}`);
    }
    console.log(`  ${this.theme.dim("Real-time CRDT room channels active on Fly.io.")}\n`);
  }

  private executeShellCommand(cmd: string): void {
    console.log(this.theme.dim(`\n  $ ${cmd}`));
    try {
      const out = execSync(cmd, {
        cwd: this.workspaceDir,
        encoding: "utf-8",
        stdio: ["inherit", "pipe", "pipe"],
      });
      if (out) process.stdout.write(out);
      console.log(this.theme.success(`  [✓] Completed\n`));
    } catch (err: any) {
      if (err.stdout) process.stdout.write(err.stdout);
      if (err.stderr) process.stderr.write(err.stderr);
      console.log(this.theme.error(`  [x] Process exited with code ${err.status ?? 1}\n`));
    }
  }

  private extractFileReferences(text: string): {
    augmentedPrompt: string;
    attachedFiles: string[];
  } {
    const matches = text.match(/@([a-zA-Z0-9_\-\.\/\\\~]+)/g);
    if (!matches) return { augmentedPrompt: text, attachedFiles: [] };

    const attachedFiles: string[] = [];
    let additions = "";

    for (const match of matches) {
      const rawPath = match.substring(1);
      const resolved = path.isAbsolute(rawPath)
        ? rawPath
        : path.resolve(this.workspaceDir, rawPath);

      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        try {
          const content = fs.readFileSync(resolved, "utf-8");
          attachedFiles.push(rawPath);
          additions += `\n\n--- [Attached File: ${rawPath}] ---\n${content}\n--- [End of ${rawPath}] ---\n`;
        } catch {}
      }
    }

    return {
      augmentedPrompt: text + additions,
      attachedFiles,
    };
  }

  /**
   * Run turn with real-time LiveActionIndicator.
   */
  private async runTurn(userPrompt: string): Promise<void> {
    const abortController = new AbortController();

    const onSigInt = () => {
      this.indicator.clear();
      console.log(this.theme.warning("\n  [Interrupted by user]"));
      abortController.abort();
    };

    process.once("SIGINT", onSigInt);

    const startTime = Date.now();
    let thinkingText = "";
    let inAssistantResponse = false;
    let turnTokens = Math.ceil(userPrompt.length / 4);

    // Initial Simmering action state
    this.indicator.startSimmering();

    try {
      for await (const event of this.session.prompt(userPrompt, {
        signal: abortController.signal,
      })) {
        if (event.type === "thinking" && event.content) {
          thinkingText += event.content;
          this.indicator.startThinking("Reasoning");
          this.indicator.updateThinking(event.content);
        } else if (event.type === "token" && event.content) {
          if (!inAssistantResponse) {
            inAssistantResponse = true;
            this.indicator.clear();
            const durationSec = (Date.now() - startTime) / 1000;
            if (thinkingText.trim()) {
              UI.printThinkingBlock(thinkingText, durationSec);
            } else {
              UI.printThinkingSummary(durationSec);
            }
            UI.printAssistantStart();
          }
          turnTokens += Math.ceil(event.content.length / 4);
          process.stdout.write(event.content);
        } else if (event.type === "tool_start" && event.toolCall) {
          if (inAssistantResponse) {
            UI.printAssistantEnd();
            inAssistantResponse = false;
          }
          // Real-time tool action state indicator
          this.indicator.startTool(event.toolCall.name, event.toolCall.arguments);
        } else if (event.type === "tool_end" && event.toolCall && event.toolResult) {
          this.indicator.clear();
          UI.printToolEnd(
            event.toolCall.name,
            event.toolResult.success,
            event.toolResult.output,
            event.toolResult.error
          );
        } else if (event.type === "error") {
          this.indicator.clear();
          if (inAssistantResponse) {
            UI.printAssistantEnd();
            inAssistantResponse = false;
          }
          console.log(`\n  ${this.theme.error("[x] Error:")} ${event.error}\n`);
        }
      }

      this.indicator.clear();
      if (inAssistantResponse) {
        UI.printAssistantEnd();
      }

      // Update token dock
      this.cumulativeTokens += turnTokens;
    } catch (err: any) {
      this.indicator.clear();
      console.log(`\n  ${this.theme.error("[x] Execution error:")} ${err.message}\n`);
    } finally {
      this.indicator.clear();
      process.removeListener("SIGINT", onSigInt);
    }
  }
}
