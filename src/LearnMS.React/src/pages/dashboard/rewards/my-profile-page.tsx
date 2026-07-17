import { useMyRewardsQuery } from "@/api/rewards-api";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import {
  MilestoneRing,
  RewardStatGrid,
} from "@/components/rewards/reward-graphics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetProfile } from "@/generated/api";
import { Apple, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const MyProfilePage = () => {
  const { data, isLoading } = useGetProfile();
  const { data: rewardsData, isLoading: rewardsLoading } = useMyRewardsQuery();

  if (isLoading || !data?.data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  const profile = data.data;
  if (profile.$type !== "GetAssistantProfileResult") {
    return (
      <DashboardPageShell title="My Profile" description="Profile preview" icon={UserRound}>
        <p className="text-sm text-muted-foreground">This page is for assistants only.</p>
      </DashboardPageShell>
    );
  }

  const displayName = profile.fullName?.trim() || profile.email;
  const rewards = rewardsData?.data;
  const payouts = rewards?.events.filter((e) => e.type === "Payout").length ?? 0;
  const totalPaid = rewards?.events
    .filter((e) => e.type === "Payout")
    .reduce((sum, e) => sum + Math.abs(e.amount), 0) ?? 0;

  return (
    <DashboardPageShell
      title="My Profile"
      description="Your profile preview and reward summary. Only a teacher can update your name or photo."
      icon={UserRound}
      decorative
      fullWidth
    >
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="relative overflow-hidden rounded-3xl border border-color2/15 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-emerald-500/15 blur-2xl"
          />
          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <Avatar className="size-28 border-4 border-emerald-400/30 shadow-lg shadow-emerald-500/20">
              <AvatarImage
                src={profile.profilePicture ?? rewards?.profilePicture ?? undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-color2 text-2xl text-white">
                {initials(displayName) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{displayName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">Assistant</Badge>
              {rewards?.code && (
                <Badge className="rounded-full bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                  Code {rewards.code}
                </Badge>
              )}
              {(profile.permissions ?? []).slice(0, 3).map((p) => (
                <Badge key={p} variant="outline" className="border-color2/20">
                  {p}
                </Badge>
              ))}
              {(profile.permissions?.length ?? 0) > 3 && (
                <Badge variant="outline">
                  +{(profile.permissions?.length ?? 0) - 3} more
                </Badge>
              )}
            </div>
            <p className="max-w-sm text-xs text-muted-foreground">
              Ask your teacher if you need your name or profile photo updated.
            </p>
            <Button asChild variant="outline" className="mt-1 gap-2 border-emerald-500/30">
              <Link to="/dashboard/my-rewards">
                <Apple className="size-4" />
                Open full rewards
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {rewardsLoading || !rewards ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-color2/15 bg-card/50">
              <Loading />
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background/80 to-color2/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Reward overview
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Snapshot of your apple balance and session progress
                </p>
              </div>

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
                    hint: "Logged attendance",
                    icon: "sessions",
                  },
                  {
                    label: "Session value",
                    value: rewards.currentSessionValue,
                    hint: `Base ${rewards.baseSessionValue}`,
                    icon: "value",
                  },
                  {
                    label: "Until next bonus",
                    value: rewards.sessionsUntilNextBonus,
                    hint: `+${rewards.sessionBonusIncrement} / ${rewards.sessionsPerMilestone}`,
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

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-color2/10 bg-card/80 p-4">
                  <p className="text-xs text-muted-foreground">Payouts recorded</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{payouts}</p>
                </div>
                <div className="rounded-2xl border border-color2/10 bg-card/80 p-4">
                  <p className="text-xs text-muted-foreground">Apples paid out</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{totalPaid}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
};

export default MyProfilePage;
