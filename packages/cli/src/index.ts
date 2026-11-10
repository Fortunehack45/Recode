import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Recode, RecodeAuth, DEFAULT_MODELS, ModelInfo } from "@recode-dev/sdk";
import {
  Repl,
  UI,
  c,
  ThemeManager,
  FontManager,
  BorderStyleType,
  LiveActionIndicator,
} from "@recode-dev/tui";

const VERSION = "1.30.4";

function printUsage(): void {
  const theme = ThemeManager.get();
  UI.printPill(`Recode Terminal Coding Assistant v${VERSION}`);
  console.log(`
${theme.bold(theme.text("Usage:"))}
  recode [command] [options]

${theme.bold(theme.text("Commands:"))}
  ${theme.accent("(none)")}                      Launch interactive terminal coding assistant
  ${theme.accent("run <instruction>")}           Execute prompt headlessly and output results
  ${theme.accent("theme [name]")}                Browse or set active theme (synced with Recode IDE)
  ${theme.accent("font [style]")}                Configure border style (dotted, rounded, sharp, double)
  ${theme.accent("welcome")}                     Display onboarding welcome & security preview splash
  ${theme.accent("auth status")}                 Show current GitHub & API provider status
  ${theme.accent("auth login")}                  Authenticate with GitHub (Device Flow or PAT)
  ${theme.accent("auth logout")}                 Clear GitHub authentication
  ${theme.accent("auth set-key <p> <key>")}      Store API key for provider (e.g. opencode, gemini, anthropic)
  ${theme.accent("models")}                      List available AI models
  ${theme.accent("version")}                     Print version (${VERSION})

${theme.bold(theme.text("Options:"))}
  ${theme.accent("-m, --model <name>")}          Specify AI model (e.g. claude-3-7-sonnet, gpt-4o)
  ${theme.accent("-w, --workspace <dir>")}       Workspace directory (defaults to current dir)
  ${theme.accent("-t, --theme <name>")}          Launch with specific theme (e.g. ayu-dark, claude-warm)
  ${theme.accent("--welcome")}                   Force display of welcome splash on launch
  ${theme.accent("-h, --help")}                  Display help information
  ${theme.accent("-v, --version")}               Display version
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let model: string | undefined;
  let workspaceDir = process.cwd();
  let explicitTheme: string | undefined;
  let showWelcome = false;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-m" || arg === "--model") {
      model = args[++i];
    } else if (arg === "-w" || arg === "--workspace") {
      workspaceDir = args[++i];
    } else if (arg === "-t" || arg === "--theme") {
      explicitTheme = args[++i];
    } else if (arg === "--welcome") {
      showWelcome = true;
    } else if (arg === "-v" || arg === "--version" || arg === "version") {
      console.log(`recode v${VERSION}`);
      return;
    } else if (arg === "-h" || arg === "--help" || arg === "help") {
      printUsage();
      return;
    } else {
      positional.push(arg);
    }
  }

  const subCommand = positional[0]?.toLowerCase();

  // Theme subcommand
  if (subCommand === "theme" || subCommand === "themes") {
    const targetTheme = positional[1];
    if (!targetTheme) {
      UI.printThemeGallery();
      return;
    }
    const tm = ThemeManager.get();
    const ok = tm.setTheme(targetTheme, { syncIde: true });
    if (ok) {
      console.log(tm.success(`[✓] Switched theme to ${tm.theme.name} (synced with Recode IDE).`));
    } else {
      console.log(tm.error(`[x] Unknown theme "${targetTheme}". Run 'recode theme' to see all themes.`));
    }
    return;
  }

  // Font subcommand
  if (subCommand === "font") {
    const style = positional[1] as BorderStyleType;
    if (!style) {
      UI.printFontMenu();
      return;
    }
    const fm = FontManager.get();
    fm.setBorderStyle(style);
    console.log(c.green(`[✓] Updated border style to ${style}.`));
    return;
  }

  // Welcome subcommand
  if (subCommand === "welcome") {
    UI.printWelcomeSplash(VERSION);
    const rl = readline.createInterface({ input, output });
    await rl.question("");
    rl.close();
    return;
  }

  // Direct subcommands
  if (subCommand === "login") {
    await runAuthLogin();
    return;
  }
  if (subCommand === "logout") {
    RecodeAuth.logoutGitHub();
    console.log(c.green("[✓] Successfully logged out of GitHub."));
    return;
  }
  if (subCommand === "connect" || subCommand === "key") {
    const provider = positional[1];
    const key = positional.slice(2).join(" ").trim();
    if (!provider || !key) {
      console.log(c.yellow("Usage: recode connect <provider> <api_key>"));
      console.log(c.dim("Example: recode connect opencode <key> or recode connect gemini <key>"));
      process.exit(1);
    }
    RecodeAuth.setApiKey(provider, key);
    console.log(c.green(`[✓] Stored API key for ${provider.toUpperCase()}.`));
    return;
  }

  // 1. Auth subcommands
  if (subCommand === "auth") {
    const action = positional[1]?.toLowerCase();
    if (action === "login") {
      await runAuthLogin();
      return;
    }
    if (action === "logout") {
      RecodeAuth.logoutGitHub();
      console.log(c.green("Successfully logged out of GitHub."));
      return;
    }
    if (action === "set-key" || action === "connect") {
      const provider = positional[2];
      const key = positional.slice(3).join(" ").trim();
      if (!provider || !key) {
        console.log(c.red("Usage: recode auth set-key <provider> <api_key>"));
        process.exit(1);
      }
      RecodeAuth.setApiKey(provider, key);
      console.log(c.green(`[✓] Stored API key for ${provider}.`));
      return;
    }

    // Default auth action: status
    printAuthStatus();
    return;
  }

  // 2. Models subcommand
  if (subCommand === "models") {
    console.log(`\n${c.bold("Available Recode Models:")}\n`);
    for (const [key, m] of Object.entries(DEFAULT_MODELS as Record<string, ModelInfo>)) {
      console.log(`  ${c.cyan(key.padEnd(20))} ${c.bold(m.name)}`);
      console.log(`  ${c.dim("Provider:")} ${m.provider} | ${c.dim("Context:")} ${m.contextWindow.toLocaleString()} tokens`);
      console.log(`  ${c.dim(m.description)}\n`);
    }
    return;
  }

  // 3. Headless run
  if (subCommand === "run") {
    const instruction = positional.slice(1).join(" ").trim();
    if (!instruction) {
      console.log(c.red("Error: Please provide an instruction for 'recode run <instruction>'"));
      process.exit(1);
    }
    await runHeadless(instruction, model, workspaceDir);
    return;
  }

  // Apply explicit theme flag if passed
  if (explicitTheme) {
    ThemeManager.get().setTheme(explicitTheme);
  }

  // 4. Interactive TUI (default)
  const repl = new Repl({
    model,
    workspaceDir,
    showWelcome,
  });
  await repl.start();
}

function printAuthStatus(): void {
  const status = RecodeAuth.status();
  console.log(`\n${c.bold("Recode Authentication Status:")}`);
  if (status.github) {
    console.log(`  ${c.green("[✓] GitHub:")} @${status.github.username} (authenticated ${status.github.authenticatedAt})`);
  } else {
    console.log(`  ${c.yellow("[!] GitHub:")} Not connected. Run ${c.cyan("recode auth login")} to connect.`);
  }

  console.log(`\n${c.bold("Configured Provider Keys:")}`);
  for (const [p, info] of Object.entries(status.providers)) {
    const mark = info.configured ? c.green("[✓] Configured") : c.dim("Not set");
    console.log(`  ${p.padEnd(14)}: ${mark} ${c.dim(`(${info.maskedKey})`)}`);
  }
  console.log(`\n${c.dim("Default Provider:")} ${status.defaultProvider}`);
  console.log(`${c.dim("Default Model:")}    ${status.defaultModel}\n`);
}

async function runAuthLogin(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  console.log(`\n${c.cyan(c.bold("Recode GitHub Authentication"))}`);
  console.log("No email or password needed. Secure developer authentication.");
  console.log("  1. GitHub Device Flow (Recommended)");
  console.log("  2. Personal Access Token (PAT)\n");

  const method = (await rl.question(c.cyan("Select method [1/2]: "))).trim();

  if (method === "2") {
    const pat = (await rl.question(c.cyan("Enter GitHub PAT: "))).trim();
    rl.close();
    if (!pat) {
      console.log(c.yellow("Aborted."));
      return;
    }
    try {
      const auth = await RecodeAuth.loginWithGitHubToken(pat);
      console.log(c.green(`\n[✓] Authenticated successfully as @${auth.user.login}!\n`));
    } catch (err: any) {
      console.log(c.red(`\n[x] Error: ${err.message}\n`));
    }
  } else {
    rl.close();
    try {
      console.log(c.dim("\nRequesting authorization code from GitHub..."));
      await RecodeAuth.loginWithGitHubDeviceCode(
        (info) => {
          console.log(`\n${c.bold("Authorize Recode on GitHub:")}`);
          console.log(`  1. Open: ${c.cyan(c.underline(info.verification_uri))}`);
          console.log(`  2. Enter code: ${c.bgCyan(c.bold(` ${info.user_code} `))}\n`);
          console.log(c.dim("Waiting for authorization in browser... (Press Ctrl+C to cancel)"));
        },
        () => {
          process.stdout.write(c.dim("."));
        }
      );
      const st = RecodeAuth.status();
      console.log(c.green(`\n[✓] Successfully authenticated as @${st.github?.username}!\n`));
    } catch (err: any) {
      console.log(c.red(`\n[x] Authorization failed: ${err.message}\n`));
    }
  }
}

async function runHeadless(instruction: string, model?: string, workspaceDir?: string): Promise<void> {
  const recode = new Recode({
    model,
    workspaceDir,
  });

  const session = recode.createSession();
  const abortController = new AbortController();

  process.once("SIGINT", () => {
    abortController.abort();
    console.log(c.yellow("\n[Interrupted]"));
    process.exit(130);
  });

  try {
    for await (const event of session.prompt(instruction, { signal: abortController.signal })) {
      if (event.type === "token" && event.content) {
        process.stdout.write(event.content);
      } else if (event.type === "tool_start" && event.toolCall) {
        LiveActionIndicator.get().startTool(event.toolCall.name, event.toolCall.arguments);
      } else if (event.type === "tool_end" && event.toolCall && event.toolResult) {
        LiveActionIndicator.get().clear();
        UI.printToolEnd(
          event.toolCall.name,
          event.toolResult.success,
          event.toolResult.output,
          event.toolResult.error
        );
      } else if (event.type === "error") {
        LiveActionIndicator.get().clear();
        console.error(`\n${c.red("Error:")} ${event.error}`);
        process.exit(1);
      }
    }
    LiveActionIndicator.get().clear();
    console.log();
  } catch (err: any) {
    LiveActionIndicator.get().clear();
    console.error(`\n${c.red("Execution failed:")} ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c.red(`Fatal error: ${err.message}`));
  process.exit(1);
});
