interface VKAuthConfig {
  appId: string;
  redirectUri?: string;
  scope?: string;
}

export class VKAuth {
  private appId: string;
  private redirectUri: string;
  private scope: string;

  constructor(config: VKAuthConfig) {
    this.appId = config.appId;
    this.redirectUri = config.redirectUri || window.location.origin;
    this.scope = config.scope || "email";
  }

  async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create popup window for VK OAuth
      const popup = window.open(
        this.getAuthUrl(),
        "vk-auth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      if (!popup) {
        reject(new Error("Failed to open popup window"));
        return;
      }

      // Listen for messages from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== "https://oauth.vk.com") return;

        const { type, data } = event.data;

        if (type === "vk-auth-success") {
          window.removeEventListener("message", messageHandler);
          popup.close();
          resolve(data.accessToken);
        } else if (type === "vk-auth-error") {
          window.removeEventListener("message", messageHandler);
          popup.close();
          reject(new Error(data.error || "Authentication failed"));
        }
      };

      window.addEventListener("message", messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
          reject(new Error("Authentication was cancelled"));
        }
      }, 1000);
    });
  }

  private getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      response_type: "token",
      scope: this.scope,
      v: "5.131",
    });

    return `https://oauth.vk.com/authorize?${params.toString()}`;
  }
}

// Initialize VK Auth with app ID from environment
export const vkAuth = new VKAuth({
  appId: import.meta.env.VITE_VK_APP_ID || "your_vk_app_id",
});
