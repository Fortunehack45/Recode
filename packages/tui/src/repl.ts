import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";
import { Recode, Session, RecodeAuth, DEFAULT_MODELS, ModelInfo } from "@recode/sdk";
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
    this.currentModel = options.model || status.defaultModel || "claude-3-7-sonnet";
    this.recode = new Recode({
      model: this.currentModel,
      workspaceDir: this.workspaceDir,
    });
    this.session = this.recode.createSession({
      model: this.currentModel,
      workspaceDir: this.workspaceDir,
    });
  }

  public async start(): Promise<void> {
    const rl = readline.createInterface({ input, output });

    console.clear();
    UI.printBanner();
    UI.printStatusBar(this.recode.status(), this.workspaceDir, this.currentModel);

    while (this.running) {
      let line = "";
      try {
        const promptSymbol = c.cyan(c.bold("recode > "));
        line = await rl.question(promptSymbol);
      } catch {
        break;
      }

      line = line.trim();
      if (!line) continue;

      if (line.startsWith("/")) {
        await this.handleSlashCommand(line, rl);
        continue;
      }

      await this.runTurn(line);
    }

    rl.close();
    console.log(c.dim("\nGoodbye from Recode."));
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

  private async handleSlashCommand(command: string, rl: readline.Interface): Promise<void> {
    const parts = command.split(" ");
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ").trim();

    switch (cmd) {
      case "/help":
        UI.printHelp();
        break;

      case "/clear":
        console.clear();
        this.session.reset();
        UI.printBanner();
        UI.printStatusBar(this.recode.status(), this.workspaceDir, this.currentModel);
        console.log(c.dim("Context cleared.\n"));
        break;

      case "/exit":
      case "/quit":
        this.running = false;
        break;

      case "/model":
        if (!arg) {
          console.log(`Current model: ${c.magenta(this.currentModel)}`);
        } else {
          this.currentModel = arg;
          this.session = this.recode.createSession({
            model: this.currentModel,
            workspaceDir: this.workspaceDir,
          });
          console.log(`Switched model to ${c.magenta(this.currentModel)}\n`);
        }
        break;

      case "/models":
        console.log(`\n${c.bold("Available Models:")}`);
        for (const [key, m] of Object.entries(DEFAULT_MODELS as Record<string, ModelInfo>)) {
          const active = key === this.currentModel || m.id === this.currentModel;
          const prefix = active ? c.green("● [Active] ") : "  ";
          console.log(`${prefix}${c.bold(key.padEnd(20))} ${c.dim(m.name)} - ${m.description}`);
        }
        console.log();
        break;

      case "/auth":
        if (arg === "login") {
          await this.interactiveLogin(rl);
        } else if (arg === "logout") {
          RecodeAuth.logoutGitHub();
          console.log(c.green("Logged out of GitHub.\n"));
        } else {
          this.printAuthStatus();
        }
        break;

      case "/diff":
        try {
          const diff = execSync("git diff --stat", { cwd: this.workspaceDir, encoding: "utf-8" });
          console.log(`\n${c.bold("Git Diff Summary:")}\n${diff || "No changes."}\n`);
        } catch {
          console.log(c.yellow("Git diff not available or repository not initialized."));
        }
        break;

      case "/status":
        try {
          const st = execSync("git status -s", { cwd: this.workspaceDir, encoding: "utf-8" });
          console.log(`\n${c.bold("Git Status:")}\n${st || "Working tree clean."}\n`);
        } catch {
          console.log(c.yellow("Git status not available."));
        }
        break;

      default:
        console.log(c.yellow(`Unknown command "${command}". Type /help for available commands.\n`));
    }
  }

  private printAuthStatus(): void {
    const status = this.recode.status();
    console.log(`\n${c.bold("Authentication Status:")}`);
    if (status.github) {
      console.log(`  ${c.green("GitHub:")} @${status.github.username} (authenticated ${status.github.authenticatedAt})`);
    } else {
      console.log(`  ${c.yellow("GitHub:")} Not connected (run /auth login or recode auth login)`);
    }

    console.log(`\n${c.bold("Configured Provider Keys:")}`);
    for (const [p, info] of Object.entries(status.providers)) {
      const mark = info.configured ? c.green("✓ Configured") : c.dim("Not set");
      console.log(`  ${p.padEnd(14)}: ${mark} ${c.dim(`(${info.maskedKey})`)}`);
    }
    console.log();
  }

  private async interactiveLogin(rl: readline.Interface): Promise<void> {
    console.log(`\n${c.cyan(c.bold("GitHub Authentication"))}`);
    console.log(`Choose authentication method:`);
    console.log(`  1. GitHub Device Flow (Recommended - opens browser code)`);
    console.log(`  2. Personal Access Token (PAT)`);

    const choice = (await rl.question(c.cyan("Select [1/2]: "))).trim();

    if (choice === "2") {
      const pat = (await rl.question(c.cyan("Enter GitHub PAT: "))).trim();
      if (!pat) {
        console.log(c.yellow("Cancelled.\n"));
        return;
      }
      try {
        const auth = await RecodeAuth.loginWithGitHubToken(pat);
        console.log(c.green(`\n✓ Authenticated successfully as @${auth.user.login}!\n`));
      } catch (err: any) {
        console.log(c.red(`\n✗ Error: ${err.message}\n`));
      }
    } else {
      try {
        console.log(c.dim("\nRequesting device code from GitHub..."));
        await RecodeAuth.loginWithGitHubDeviceCode(
          (info) => {
            console.log(`\n${c.bold("GitHub Device Verification:")}`);
            console.log(`  1. Open: ${c.cyan(c.underline(info.verification_uri))}`);
            console.log(`  2. Enter code: ${c.bgCyan(c.bold(` ${info.user_code} `))}\n`);
            console.log(c.dim("Waiting for authorization in your browser... (press Ctrl+C to cancel)"));
          },
          () => {
            process.stdout.write(c.dim("."));
          }
        );
        const st = RecodeAuth.status();
        console.log(c.green(`\n✓ Successfully authenticated as @${st.github?.username}!\n`));
      } catch (err: any) {
        console.log(c.red(`\n✗ Authorization failed: ${err.message}\n`));
      }
    }
  }
}
