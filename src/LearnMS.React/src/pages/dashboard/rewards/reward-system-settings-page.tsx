import {
  useRewardSystemSettingsQuery,
  useUpdateRewardSystemSettingsMutation,
} from "@/api/rewards-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

const RewardSystemSettingsPage = () => {
  const { data, isLoading } = useRewardSystemSettingsQuery();
  const updateMutation = useUpdateRewardSystemSettingsMutation();

  const [baseSessionValue, setBaseSessionValue] = useState(150);
  const [sessionsPerMilestone, setSessionsPerMilestone] = useState(20);
  const [sessionBonusIncrement, setSessionBonusIncrement] = useState(20);
  const [maxSessionValue, setMaxSessionValue] = useState(200);

  useEffect(() => {
    if (!data?.data) return;
    setBaseSessionValue(data.data.baseSessionValue);
    setSessionsPerMilestone(data.data.sessionsPerMilestone);
    setSessionBonusIncrement(data.data.sessionBonusIncrement);
    setMaxSessionValue(data.data.maxSessionValue);
  }, [data?.data]);

  if (isLoading || !data?.data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  const settings = data.data;
  const previewSteps = [
    baseSessionValue,
    Math.min(baseSessionValue + sessionBonusIncrement, maxSessionValue),
    Math.min(baseSessionValue + sessionBonusIncrement * 2, maxSessionValue),
    maxSessionValue,
  ];

  const onSave = () => {
    if (
      baseSessionValue <= 0 ||
      sessionsPerMilestone <= 0 ||
      sessionBonusIncrement <= 0 ||
      maxSessionValue < baseSessionValue
    ) {
      toast({
        title: "Invalid settings",
        description:
          "Base pay, sessions per bonus, and bonus amount must be positive. Max value must be at least base pay.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate(
      {
        baseSessionValue,
        sessionsPerMilestone,
        sessionBonusIncrement,
        maxSessionValue,
      },
      {
        onSuccess: () => {
          toast({
            title: "Settings saved",
            description: "Assistant session pay and bonus rules were updated.",
          });
        },
      }
    );
  };

  return (
    <DashboardPageShell
      title="Reward System Settings"
      description="Control assistant base pay, bonus size, sessions between bonuses, and the maximum session value."
      icon={SlidersHorizontal}
      fullWidth
      decorative
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <DashboardCard>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Pay & bonus formula</h3>
              <p className="text-sm text-muted-foreground">
                Changes apply to the next session attendance for all assistants.
              </p>
            </div>
            <Badge variant="outline" className="border-color2/25">
              Updated {format(new Date(settings.updatedAt), "dd MMM yyyy, HH:mm")}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="base-session-value">Base session pay</Label>
              <Input
                id="base-session-value"
                type="number"
                min={1}
                value={baseSessionValue}
                onChange={(e) => setBaseSessionValue(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Starting apple value for each attended session
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-bonus-increment">Bonus amount</Label>
              <Input
                id="session-bonus-increment"
                type="number"
                min={1}
                value={sessionBonusIncrement}
                onChange={(e) => setSessionBonusIncrement(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                How many apples are added at each bonus milestone
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions-per-milestone">Sessions until bonus</Label>
              <Input
                id="sessions-per-milestone"
                type="number"
                min={1}
                value={sessionsPerMilestone}
                onChange={(e) => setSessionsPerMilestone(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Number of attended sessions before the bonus is added
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-session-value">Maximum session value</Label>
              <Input
                id="max-session-value"
                type="number"
                min={1}
                value={maxSessionValue}
                onChange={(e) => setMaxSessionValue(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Session pay will not go above this amount
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={onSave}
              disabled={updateMutation.isPending}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-color2 text-white"
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Save settings
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard>
          <h3 className="text-lg font-semibold">Live preview</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Base {baseSessionValue} + {sessionBonusIncrement} every{" "}
            {sessionsPerMilestone} sessions, capped at {maxSessionValue}.
          </p>

          <div className="mt-5 space-y-3">
            {[
              { label: "First sessions", value: previewSteps[0] },
              {
                label: `After ${sessionsPerMilestone} sessions`,
                value: previewSteps[1],
              },
              {
                label: `After ${sessionsPerMilestone * 2} sessions`,
                value: previewSteps[2],
              },
              { label: "At maximum", value: previewSteps[3] },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-color2/10 bg-muted/30 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className="text-base font-semibold tabular-nums">
                  {row.value} apples
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </DashboardPageShell>
  );
};

export default RewardSystemSettingsPage;
