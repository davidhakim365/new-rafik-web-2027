import { PAYMENT_REQUESTS_QUERY_KEY } from "@/api/payment-requests-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Permission } from "@/generated/model";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import {
  getPushSupport,
  onPaymentAlertsFlagChange,
  readPaymentAlertsFlag,
  sendTestPaymentAlert,
  subscribeThisPhone,
  unsubscribeThisPhone,
  writePaymentAlertsFlag,
} from "@/lib/payment-push";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function usePaymentAlertsFlag() {
  const [enabled, setEnabled] = useState(readPaymentAlertsFlag);
  useEffect(
    () => onPaymentAlertsFlagChange(() => setEnabled(readPaymentAlertsFlag())),
    []
  );
  return enabled;
}

/**
 * Keeps this phone's subscription current and refreshes the open list when an alert arrives.
 * The alert itself comes from the service worker, so it also shows with the site closed.
 */
export function PaymentRequestAlerts() {
  const { hasPermission } = useDashboardPermissions();
  const canReview = hasPermission(Permission.ManagePaymentRequests);
  const enabled = usePaymentAlertsFlag();
  const qc = useQueryClient();

  useEffect(() => {
    if (!canReview || !enabled) return;
    if (getPushSupport() !== "ok" || Notification.permission !== "granted") {
      writePaymentAlertsFlag(false);
      return;
    }
    subscribeThisPhone().catch(() => undefined);
  }, [canReview, enabled]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "payment-request-push") return;
      void qc.invalidateQueries({ queryKey: [PAYMENT_REQUESTS_QUERY_KEY] });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [qc]);

  return null;
}

export function PaymentRequestAlertsSwitch() {
  const enabled = usePaymentAlertsFlag();
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const turnOn = async () => {
    const support = getPushSupport();
    if (support === "ios-install") {
      toast({
        title: "Add the site to your Home Screen first",
        description:
          "On iPhone: tap Share, then Add to Home Screen. Open Mr Rafik from the new icon, sign in, and turn this on there.",
        variant: "destructive",
      });
      return;
    }
    if (support === "unsupported") {
      toast({
        title: "This browser cannot get alerts",
        description: "Open the site in Chrome on Android, or Safari on iPhone, and turn this on again.",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast({
        title: "Notifications are blocked",
        description:
          "Allow notifications for this site in the phone settings, then turn the switch on again.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      await subscribeThisPhone();
      writePaymentAlertsFlag(true);
      toast({
        title: "Payment alerts are on",
        description:
          "This phone will be notified of new payment requests, even with the site closed or the screen off.",
      });
    } catch {
      toast({
        title: "Could not turn on alerts",
        description: "Check the connection and try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await unsubscribeThisPhone();
    } finally {
      writePaymentAlertsFlag(false);
      setBusy(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const res = await sendTestPaymentAlert();
      toast({
        title: res.data > 0 ? "Test alert sent" : "No phone is subscribed yet",
        description:
          res.data > 0
            ? "Lock the screen now. The alert should arrive within a few seconds."
            : "Turn the switch off and on again.",
      });
    } catch {
      // The API layer already shows the error.
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-color2/15 bg-background/80 px-3 py-2 sm:w-auto">
      <Label htmlFor="payment-request-alerts" className="text-sm font-medium">
        Notify on new requests
      </Label>
      <div className="flex items-center gap-2">
        {enabled && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            disabled={testing || busy}
            onClick={() => void onTest()}
          >
            {testing ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="mr-1 h-4 w-4" />
            )}
            Test
          </Button>
        )}
        <Switch
          id="payment-request-alerts"
          checked={enabled}
          disabled={busy}
          onCheckedChange={(checked) => {
            void (checked ? turnOn() : turnOff());
          }}
        />
      </div>
    </div>
  );
}
