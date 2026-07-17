import { useMyRewardsQuery } from "@/api/rewards-api";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import {
  MilestoneRing,
  RewardEventTimeline,
  RewardHeroBanner,
  RewardStatGrid,
} from "@/components/rewards/reward-graphics";
import { Badge } from "@/components/ui/badge";
import { Apple } from "lucide-react";

const MyRewardsPage = () => {
  const { data, isLoading } = useMyRewardsQuery();

  if (isLoading || !data?.data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  const rewards = data.data;
  const payouts = rewards.events.filter((e) => e.type === "Payout").length;

  return (
    <DashboardPageShell
      title="My Rewards"
      description="Track your session attendance, apple balance, and progress to the next pay bonus."
      icon={Apple}
      fullWidth
      decorative
    >
      <div className="space-y-5">
        <RewardHeroBanner
          badge="Assistant rewards"
          title="Your pay progress"
          subtitle="Apples grow with consistent attendance. When the teacher pays rewards, your balance resets and the payout is logged here."
        >
          <Badge className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
            Code {rewards.code}
          </Badge>
          <Badge variant="outline" className="rounded-full border-color2/25 px-3 py-1.5">
            {payouts} payout{payouts === 1 ? "" : "s"} recorded
          </Badge>
        </RewardHeroBanner>

        <RewardStatGrid
          stats={[
            {
              label: "Apples balance",
              value: rewards.apples,
              hint: "Waiting for payout",
              icon: "apples",
            },
            {
              label: "Sessions attended",
              value: rewards.sessionsAttended,
              hint: "Consistent attendance",
              icon: "sessions",
            },
            {
              label: "Current session value",
              value: rewards.currentSessionValue,
              hint: `Base ${rewards.baseSessionValue}`,
              icon: "value",
            },
            {
              label: "Until next bonus",
              value: rewards.sessionsUntilNextBonus,
              hint: `+${rewards.sessionBonusIncrement} every ${rewards.sessionsPerMilestone}`,
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

        <RewardEventTimeline
          events={rewards.events}
          emptyText="No payments or attendance events yet"
        />
      </div>
    </DashboardPageShell>
  );
};

export default MyRewardsPage;
