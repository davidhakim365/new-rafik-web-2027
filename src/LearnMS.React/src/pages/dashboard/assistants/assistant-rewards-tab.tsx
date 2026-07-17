import {
  AdjustAssistantApplesRequest,
  useAdjustAssistantApplesMutation,
  useAssistantRewardsQuery,
  useAttendAssistantSessionMutation,
  usePayAssistantRewardsMutation,
} from "@/api/rewards-api";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import {
  MilestoneRing,
  RewardEventTimeline,
  RewardHeroBanner,
  RewardStatGrid,
} from "@/components/rewards/reward-graphics";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/utils";
import { Assistant } from "@/types/assistants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, QrCode, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

export function AssistantRewardsTab({ assistant }: { assistant: Assistant }) {
  const { data, isLoading } = useAssistantRewardsQuery(assistant.id);
  const attendMutation = useAttendAssistantSessionMutation();
  const adjustMutation = useAdjustAssistantApplesMutation();
  const payMutation = usePayAssistantRewardsMutation();

  const form = useForm<AdjustAssistantApplesRequest>({
    resolver: zodResolver(AdjustAssistantApplesRequest),
    defaultValues: { amount: 0, reason: "" },
  });

  if (isLoading || !data?.data) {
    return <Loading />;
  }

  const rewards = data.data;

  const onAttend = () => {
    attendMutation.mutate(
      { assistantId: assistant.id },
      {
        onSuccess: (res) => {
          toast({
            title: "Session attended",
            description: res.message ?? res.data?.message,
          });
        },
      }
    );
  };

  const onPay = () => {
    payMutation.mutate(
      { assistantId: assistant.id },
      {
        onSuccess: (res) => {
          toast({
            title: "Rewards paid",
            description: res.message ?? res.data?.message,
          });
        },
      }
    );
  };

  const onAdjust = (values: AdjustAssistantApplesRequest) => {
    adjustMutation.mutate(
      { assistantId: assistant.id, data: values },
      {
        onSuccess: (res) => {
          toast({
            title: "Apples updated",
            description: res.message ?? res.data?.message,
          });
          form.reset({ amount: 0, reason: "" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <RewardHeroBanner
        badge="Assistant pay system"
        title={assistant.email}
        subtitle={`Code ${rewards.code} · Base ${rewards.baseSessionValue} + ${rewards.sessionBonusIncrement} every ${rewards.sessionsPerMilestone} sessions`}
      >
        <Button
          onClick={onAttend}
          disabled={attendMutation.isPending}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-color2 text-white shadow-md shadow-emerald-500/20 hover:opacity-95"
        >
          <Sparkles className="size-4" />
          Attend session
        </Button>
        <Button asChild variant="outline" className="gap-2 border-emerald-500/30">
          <Link to="/dashboard/assistant-rewards-scanner">
            <QrCode className="size-4" />
            Scan / type code
          </Link>
        </Button>
        <Confirmation
          button={
            <Button
              variant="secondary"
              disabled={payMutation.isPending || rewards.apples <= 0}
              className="gap-2"
            >
              <Banknote className="size-4" />
              Pay rewards
            </Button>
          }
          title="Pay this assistant's rewards?"
          description={`This resets ${rewards.apples} apples to 0 and logs a payout. Sessions attended stay the same.`}
          onConfirm={onPay}
        />
      </RewardHeroBanner>

      <RewardStatGrid
        stats={[
          {
            label: "Apples balance",
            value: rewards.apples,
            hint: "Ready to pay",
            icon: "apples",
          },
          {
            label: "Sessions",
            value: rewards.sessionsAttended,
            hint: "Attended total",
            icon: "sessions",
          },
          {
            label: "Session value",
            value: rewards.currentSessionValue,
            hint: "Next attend award",
            icon: "value",
          },
          {
            label: "Until bonus",
            value: rewards.sessionsUntilNextBonus,
            hint: "Sessions remaining",
            icon: "bonus",
          },
        ]}
      />

      <MilestoneRing
        sessionsAttended={rewards.sessionsAttended}
        sessionsUntilNextBonus={rewards.sessionsUntilNextBonus}
        sessionsPerMilestone={rewards.sessionsPerMilestone}
        currentSessionValue={rewards.currentSessionValue}
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <RewardEventTimeline events={rewards.events} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onAdjust)}
            className="relative overflow-hidden rounded-3xl border border-color2/15 bg-card/80 p-5 backdrop-blur-sm"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-emerald-500/10 blur-2xl"
            />
            <p className="relative z-10 text-sm font-semibold">Manual apple adjust</p>
            <p className="relative z-10 mb-4 text-xs text-muted-foreground">
              Add or remove apples outside of session attendance
            </p>
            <div className="relative z-10 grid gap-3">
              <FormField
                name="amount"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (+/-)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="reason"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional note" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={adjustMutation.isPending} className="mt-1">
                Apply adjustment
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
