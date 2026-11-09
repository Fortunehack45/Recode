import { GitHubAuth, GitHubUser } from "./store.js";

export const DEFAULT_RECODE_GITHUB_CLIENT_ID = "Ov23liRecodeIDEApp";

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface TokenPollResult {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export class GitHubAuthClient {
  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.RECODE_GITHUB_CLIENT_ID || DEFAULT_RECODE_GITHUB_CLIENT_ID;
  }

  /**
   * Step 1 of Device Flow: Request a device code from GitHub.
   * Returns user_code, verification_uri, and device_code.
   */
  public async requestDeviceCode(scope = "read:user,repo"): Promise<DeviceCodeResponse> {
    const response = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Recode-Terminal/1.30.0",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        scope,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to request GitHub device code (${response.status}): ${errText}`);
    }

    return (await response.json()) as DeviceCodeResponse;
  }

  /**
   * Step 2 of Device Flow: Poll GitHub OAuth endpoint until user approves or code expires.
   */
  public async pollForToken(
    deviceCode: string,
    intervalSeconds = 5,
    expiresInSeconds = 900,
    onPoll?: () => void
  ): Promise<string> {
    const startTime = Date.now();
    const timeoutMs = expiresInSeconds * 1000;
    let pollInterval = Math.max(intervalSeconds, 5) * 1000;

    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      if (onPoll) onPoll();

      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "Recode-Terminal/1.30.0",
        },
        body: JSON.stringify({
          client_id: this.clientId,
          device_code: deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error during GitHub polling: ${response.status}`);
      }

      const data = (await response.json()) as TokenPollResult;

      if (data.access_token) {
        return data.access_token;
      }

      if (data.error) {
        switch (data.error) {
          case "authorization_pending":
            // Continue waiting
            break;
          case "slow_down":
            // Rate limit warning, increase interval by 5 seconds
            pollInterval += 5000;
            break;
          case "expired_token":
            throw new Error("GitHub authorization code expired. Please run 'recode auth login' again.");
          case "access_denied":
            throw new Error("GitHub authorization was cancelled or denied by user.");
          default:
            throw new Error(`GitHub authorization error: ${data.error_description || data.error}`);
        }
      }
    }

    throw new Error("GitHub device authorization timed out.");
  }

  /**
   * Fetch authenticated GitHub user details from https://api.github.com/user.
   */
  public async fetchUser(token: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Recode-Terminal/1.30.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub profile (${response.status})`);
    }

    const data = (await response.json()) as any;
    return {
      login: data.login,
      id: data.id,
      avatar_url: data.avatar_url,
      name: data.name,
      email: data.email,
    };
  }

  /**
   * Validate an existing personal access token (PAT) or OAuth token.
   */
  public async validateToken(token: string): Promise<GitHubAuth> {
    const user = await this.fetchUser(token);
    return {
      token,
      user,
      authenticated_at: new Date().toISOString(),
    };
  }
}
