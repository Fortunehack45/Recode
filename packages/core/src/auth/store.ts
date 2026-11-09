import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name?: string;
  email?: string; // only if user made it public on GitHub
}

export interface GitHubAuth {
  token: string;
  user: GitHubUser;
  authenticated_at: string;
}

export interface ProviderKeys {
  anthropic?: string;
  openai?: string;
  gemini?: string;
  openrouter?: string;
  deepseek?: string;
  groq?: string;
  ollama_base_url?: string;
  [key: string]: string | undefined;
}

export interface RecodeAuthConfig {
  github?: GitHubAuth;
  providers: ProviderKeys;
  default_provider?: string;
  default_model?: string;
  collab?: {
    server_url?: string;
    token?: string;
  };
}

export class AuthStore {
  private static configPath: string | null = null;

  public static getPath(): string {
    if (this.configPath) return this.configPath;

    const custom = process.env.RECODE_CONFIG_DIR;
    if (custom) {
      this.configPath = path.join(custom, "auth.json");
      return this.configPath;
    }

    const home = os.homedir();
    if (process.platform === "win32") {
      const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
      this.configPath = path.join(appData, "Recode", "auth.json");
    } else {
      this.configPath = path.join(home, ".config", "recode", "auth.json");
    }
    return this.configPath;
  }

  public static setCustomPath(customPath: string): void {
    this.configPath = customPath;
  }

  public static load(): RecodeAuthConfig {
    const filePath = this.getPath();
    let data: Partial<RecodeAuthConfig> = {};

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        data = JSON.parse(raw);
      } catch (err) {
        console.warn(`[Recode Auth] Warning: Could not parse auth file at ${filePath}`);
      }
    }

    const providers: ProviderKeys = {
      anthropic: process.env.ANTHROPIC_API_KEY || data.providers?.anthropic,
      openai: process.env.OPENAI_API_KEY || data.providers?.openai,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || data.providers?.gemini,
      openrouter: process.env.OPENROUTER_API_KEY || data.providers?.openrouter,
      deepseek: process.env.DEEPSEEK_API_KEY || data.providers?.deepseek,
      groq: process.env.GROQ_API_KEY || data.providers?.groq,
      ollama_base_url: process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || data.providers?.ollama_base_url || "http://localhost:11434",
      ...data.providers,
    };

    let github = data.github;
    if (!github && process.env.GITHUB_TOKEN) {
      github = {
        token: process.env.GITHUB_TOKEN,
        user: {
          login: "env_user",
          id: 0,
          avatar_url: "https://github.com/ghost.png",
        },
        authenticated_at: new Date().toISOString(),
      };
    }

    return {
      github,
      providers,
      default_provider: data.default_provider || "anthropic",
      default_model: data.default_model || "claude-3-7-sonnet",
      collab: {
        server_url: process.env.RECODE_COLLAB_URL || data.collab?.server_url || "wss://recode-collab.fly.dev",
        token: data.collab?.token,
      },
    };
  }

  public static save(config: RecodeAuthConfig): void {
    const filePath = this.getPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const json = JSON.stringify(config, null, 2);
    fs.writeFileSync(filePath, json, { encoding: "utf-8", mode: 0o600 });
  }

  public static setGitHubAuth(auth: GitHubAuth): void {
    const config = this.load();
    config.github = auth;
    this.save(config);
  }

  public static clearGitHubAuth(): void {
    const config = this.load();
    delete config.github;
    this.save(config);
  }

  public static setProviderKey(provider: string, key: string): void {
    const config = this.load();
    config.providers[provider.toLowerCase()] = key;
    this.save(config);
  }

  public static removeProviderKey(provider: string): void {
    const config = this.load();
    delete config.providers[provider.toLowerCase()];
    this.save(config);
  }

  public static maskSecret(secret?: string): string {
    if (!secret) return "Not set";
    if (secret.length <= 8) return "********";
    return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
  }
}
