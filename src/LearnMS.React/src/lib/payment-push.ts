import { api } from "@/api";

const ALERTS_KEY = "payment-request-notifications";
const ALERTS_EVENT = "payment-request-alerts";

export type PushSupport = "ok" | "ios-install" | "unsupported";

export function readPaymentAlertsFlag() {
  return localStorage.getItem(ALERTS_KEY) === "1";
}

export function writePaymentAlertsFlag(on: boolean) {
  localStorage.setItem(ALERTS_KEY, on ? "1" : "0");
  window.dispatchEvent(new Event(ALERTS_EVENT));
}

export function onPaymentAlertsFlagChange(listener: () => void) {
  window.addEventListener(ALERTS_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(ALERTS_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function getPushSupport(): PushSupport {
  if (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  ) {
    return "ok";
  }
  const isIos =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !installed ? "ios-install" : "unsupported";
}

function base64UrlToBytes(value: string) {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameKey(subscription: PushSubscription, key: Uint8Array) {
  const current = subscription.options?.applicationServerKey;
  if (!current) return true;
  const bytes = new Uint8Array(current);
  return bytes.length === key.length && bytes.every((b, i) => b === key[i]);
}

async function registerWorker() {
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

/** Links this phone to the signed-in assistant so the server can wake it for new requests. */
export async function subscribeThisPhone() {
  const registration = await registerWorker();
  const publicKey = await api
    .get<{ data: string }>("/api/push/public-key")
    .then((res) => res.data.data);
  const key = base64UrlToBytes(publicKey);

  let subscription = await registration.pushManager.getSubscription();
  if (subscription && !sameKey(subscription, key)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });

  await api.post("/api/push/subscriptions", subscription.toJSON());
}

export async function unsubscribeThisPhone() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await api
    .post("/api/push/subscriptions/remove", { endpoint: subscription.endpoint })
    .catch(() => undefined);
  await subscription.unsubscribe().catch(() => undefined);
}

export async function sendTestPaymentAlert() {
  return api
    .post<{ data: number; message?: string }>("/api/push/test")
    .then((res) => res.data);
}
