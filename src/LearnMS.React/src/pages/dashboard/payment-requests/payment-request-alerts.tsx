import {
  PaymentRequestItem,
  usePaymentRequestsQuery,
} from "@/api/payment-requests-api";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import { Permission } from "@/generated/model";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";

const ALERTS_KEY = "payment-request-notifications";
const SEEN_KEY = "payment-request-alert-seen";
const ALERTS_EVENT = "payment-request-alerts";

function readAlertsEnabled() {
  return localStorage.getItem(ALERTS_KEY) === "1";
}

function loadSeenIds() {
  const raw = localStorage.getItem(SEEN_KEY);
  if (!raw) return null;
  try {
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return null;
    return new Set(ids.filter((id): id is string => typeof id === "string"));
  } catch {
    return null;
  }
}

function saveSeenIds(ids: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)));
}

function publishAlertsChange() {
  window.dispatchEvent(new Event(ALERTS_EVENT));
}

function usePaymentRequestAlertsEnabled() {
  const [enabled, setEnabled] = useState(readAlertsEnabled);

  useEffect(() => {
    const sync = () => setEnabled(readAlertsEnabled());
    window.addEventListener(ALERTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ALERTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return enabled;
}

function alertCopy(items: PaymentRequestItem[]) {
  const title =
    items.length === 1
      ? "New payment request"
      : `${items.length} new payment requests`;
  const body =
    items.length === 1
      ? `${items[0].studentName} sent ${items[0].amount} LE`
      : items
          .slice(0, 3)
          .map((item) => `${item.studentName} · ${item.amount} LE`)
          .join(", ");
  return { title, body };
}

function showPhoneNotification(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  try {
    const notification = new Notification(title, {
      body,
      tag: "payment-requests",
    });
    notification.onclick = () => {
      window.focus();
      if (!window.location.pathname.startsWith("/dashboard/payment-requests")) {
        window.location.assign("/dashboard/payment-requests");
      }
      notification.close();
    };
  } catch {
    // This phone only shows notifications from an installed home-screen app.
  }
}

function PaymentRequestAlertWatcher() {
  const query = usePaymentRequestsQuery(
    { page: 1, pageSize: 30, status: "Pending", sort: "newest" },
    { background: true }
  );
  const seen = useRef<Set<string> | null>(loadSeenIds());

  useEffect(() => {
    const items = query.data?.data?.items;
    if (!items) return;

    if (seen.current === null) {
      seen.current = new Set(items.map((item) => item.id));
      saveSeenIds(seen.current);
      return;
    }

    const fresh = items.filter((item) => !seen.current!.has(item.id));
    if (fresh.length === 0) return;

    for (const item of fresh) seen.current.add(item.id);
    saveSeenIds(seen.current);

    const { title, body } = alertCopy(fresh);
    toast({ title, description: body });
    showPhoneNotification(title, body);
    navigator.vibrate?.(200);
  }, [query.data]);

  return null;
}

export function PaymentRequestAlerts() {
  const { hasPermission } = useDashboardPermissions();
  const enabled = usePaymentRequestAlertsEnabled();
  if (!hasPermission(Permission.ManagePaymentRequests) || !enabled) return null;
  return <PaymentRequestAlertWatcher />;
}

export function PaymentRequestAlertsSwitch() {
  const enabled = usePaymentRequestAlertsEnabled();

  const onChange = async (checked: boolean) => {
    if (!checked) {
      localStorage.setItem(ALERTS_KEY, "0");
      publishAlertsChange();
      return;
    }

    if (typeof Notification === "undefined") {
      toast({
        title: "This phone cannot show notifications",
        description: "Open the site in Chrome or Safari, then turn the switch on again.",
        variant: "destructive",
      });
      return;
    }

    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission !== "granted") {
      toast({
        title: "Notifications are blocked",
        description:
          "Allow notifications for this site in the phone settings, then turn the switch on again.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(ALERTS_KEY, "1");
    publishAlertsChange();
    toast({
      title: "Payment alerts are on",
      description: "This phone will notify you when a new payment request arrives.",
    });
  };

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-color2/15 bg-background/80 px-3 py-2 sm:w-auto">
      <Label htmlFor="payment-request-alerts" className="text-sm font-medium">
        Notify on new requests
      </Label>
      <Switch
        id="payment-request-alerts"
        checked={enabled}
        onCheckedChange={(checked) => {
          void onChange(checked);
        }}
      />
    </div>
  );
}
