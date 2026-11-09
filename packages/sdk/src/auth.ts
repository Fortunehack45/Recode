import {
  AuthStore,
  GitHubAuthClient,
  DeviceCodeResponse,
  GitHubAuth,
} from "@recode-dev/core";

export interface AuthStatus {
  authenticated: boolean;
  github?: {
    username: string;
    id: number;
    avatarUrl: string;
    authenticatedAt: string;
  };
  providers: Record<string, { configured: boolean; maskedKey: string }>;
  defaultProvider: string;
  defaultModel: string;
}

export class RecodeAuth {
  public static status(): AuthStatus {
    const config = AuthStore.load();
    const gh = config.github;

    const providers: Record<string, { configured: boolean; maskedKey: string }> = {};
    for (const [provider, key] of Object.entries(config.providers)) {
      if (provider === "ollama_base_url") continue;
      providers[provider] = {
        configured: Boolean(key),
        maskedKey: AuthStore.maskSecret(key),
      };
    }

    return {
      authenticated: Boolean(gh || Object.values(config.providers).some(Boolean)),
      github: gh
        ? {
            username: gh.user.login,
            id: gh.user.id,
            avatarUrl: gh.user.avatar_url,
            authenticatedAt: gh.authenticated_at,
          }
        : undefined,
      providers,
      defaultProvider: config.default_provider || "anthropic",
      defaultModel: config.default_model || "claude-3-7-sonnet",
    };
  }

  public static async loginWithGitHubDeviceCode(
    onPrompt: (info: DeviceCodeResponse) => void,
    onPoll?: () => void
  ): Promise<GitHubAuth> {
    const client = new GitHubAuthClient();
    const code = await client.requestDeviceCode();
    onPrompt(code);

    const token = await client.pollForToken(code.device_code, code.interval, code.expires_in, onPoll);
    const user = await client.fetchUser(token);
    const auth: GitHubAuth = {
      token,
      user,
      authenticated_at: new Date().toISOString(),
    };

    AuthStore.setGitHubAuth(auth);
    return auth;
  }

  public static async loginWithGitHubToken(token: string): Promise<GitHubAuth> {
    const client = new GitHubAuthClient();
    const auth = await client.validateToken(token);
    AuthStore.setGitHubAuth(auth);
    return auth;
  }

  public static logoutGitHub(): void {
    AuthStore.clearGitHubAuth();
  }

  public static setApiKey(provider: string, apiKey: string): void {
    AuthStore.setProviderKey(provider, apiKey);
  }

  public static removeApiKey(provider: string): void {
    AuthStore.removeProviderKey(provider);
  }

  public static setDefaults(provider?: string, model?: string): void {
    const config = AuthStore.load();
    if (provider) config.default_provider = provider;
    if (model) config.default_model = model;
    AuthStore.save(config);
  }
}
