// VK ID Authentication utility
export interface VKIDConfig {
  app: number;
  redirectUrl: string;
}

export interface VKAuthPayload {
  code: string;
  device_id: string;
}

declare global {
  interface Window {
    VKIDSDK?: {
      Config: {
        init(config: any): void;
      };
      FloatingOneTap: new () => {
        render(options: any): {
          on(event: string, callback: (data: any) => void): any;
        };
        close(): void;
      };
      WidgetEvents: {
        ERROR: string;
      };
      FloatingOneTapInternalEvents: {
        LOGIN_SUCCESS: string;
      };
      Auth: {
        exchangeCode(code: string, deviceId: string): Promise<any>;
      };
      ConfigResponseMode: {
        Callback: string;
      };
      ConfigSource: {
        LOWCODE: string;
      };
    };
  }
}

export class VKAuthManager {
  private floatingOneTap: any = null;
  private initialized = false;

  constructor(private config: VKIDConfig) {}

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.initialized) {
        resolve();
        return;
      }

      // Wait for VKID SDK to load
      const checkSDK = () => {
        if (window.VKIDSDK) {
          try {
            window.VKIDSDK.Config.init({
              app: this.config.app,
              redirectUrl: this.config.redirectUrl,
              responseMode: window.VKIDSDK.ConfigResponseMode.Callback,
              source: window.VKIDSDK.ConfigSource.LOWCODE,
              scope: '',
            });

            this.floatingOneTap = new window.VKIDSDK.FloatingOneTap();
            this.initialized = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          setTimeout(checkSDK, 100);
        }
      };

      checkSDK();
    });
  }

  showLoginWidget(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.floatingOneTap) {
        reject(new Error('VK ID not initialized'));
        return;
      }

      this.floatingOneTap.render({
        appName: 'StableManager',
        showAlternativeLogin: true
      })
      .on(window.VKIDSDK!.WidgetEvents.ERROR, (error: any) => {
        console.error('VK Widget Error:', error);
        reject(error);
      })
      .on(window.VKIDSDK!.FloatingOneTapInternalEvents.LOGIN_SUCCESS, (payload: VKAuthPayload) => {
        console.log('VK Login Success payload:', payload);
        window.VKIDSDK!.Auth.exchangeCode(payload.code, payload.device_id)
          .then((data) => {
            console.log('VK Auth exchange data:', data);
            this.floatingOneTap.close();
            resolve(data);
          })
          .catch((error) => {
            console.error('VK Auth exchange error:', error);
            reject(error);
          });
      });
    });
  }
}

// Create VK auth manager instance
export const vkAuth = new VKAuthManager({
  app: 54045385,
  redirectUrl: window.location.origin + '/',
});