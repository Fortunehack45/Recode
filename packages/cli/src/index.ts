import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Recode, RecodeAuth, DEFAULT_MODELS, ModelInfo } from "@recode-dev/sdk";
import { Repl, UI, c } from "@recode-dev/tui";

const VERSION = "1.30.2";

function printUsage(): void {
  UI.printBanner(VERSION);
  console.log(`
${c.bold("Usage:")}
  recode [command] [options]

${c.bold("Commands:")}
  ${c.cyan("(none)")}                      Launch interactive terminal coding assistant
  ${c.cyan("run <instruction>")}           Execute prompt headlessly and output results
  ${c.cyan("auth status")}                 Show current GitHub & API provider status
  ${c.cyan("auth login")}                  Authenticate with GitHub (Device Flow or PAT)
  ${c.cyan("auth logout")}                 Clear GitHub authentication
  ${c.cyan("auth set-key <p> <key>")}      Store API key for provider (e.g. anthropic, gemini)
  ${c.cyan("models")}                      List available AI models
  ${c.cyan("version")}                     Print version (${VERSION})

${c.bold("Options:")}
  ${c.cyan("-m, --model <name>")}          Specify AI model (e.g. claude-3-7-sonnet, gpt-4o)
  ${c.cyan("-w, --workspace <dir>")}       Workspace directory (defaults to current dir)
  ${c.cyan("-h, --help")}                  Display help information
  ${c.cyan("-v, --version")}               Display version
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let model: string | undefined;
  let workspaceDir = process.cwd();
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-m" || arg === "--model") {
      model = args[++i];
    } else if (arg === "-w" || arg === "--workspace") {
      workspaceDir = args[++i];
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
      console.log(c.dim("Example: recode connect gemini AIzaSy..."));
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

  // 4. Interactive TUI (default)
  const repl = new Repl({
    model,
    workspaceDir,
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
        UI.printToolStart(event.toolCall.name, event.toolCall.arguments);
      } else if (event.type === "tool_end" && event.toolCall && event.toolResult) {
        UI.printToolEnd(
          event.toolCall.name,
          event.toolResult.success,
          event.toolResult.output,
          event.toolResult.error
        );
      } else if (event.type === "error") {
        console.error(`\n${c.red("Error:")} ${event.error}`);
        process.exit(1);
      }
    }
    console.log();
  } catch (err: any) {
    console.error(`\n${c.red("Execution failed:")} ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c.red(`Fatal error: ${err.message}`));
  process.exit(1);
});
