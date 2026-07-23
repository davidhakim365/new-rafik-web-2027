import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/** Native shell polish — no-ops on web. */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#0f172a" });
    }
  } catch {
    /* StatusBar may be unavailable on some devices */
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  } catch {
    /* Keyboard plugin optional on webview variants */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* Splash already auto-hidden */
  }
}
