import { useMyRewardsQuery } from "@/api/rewards-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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

  return (
    <DashboardPageShell
      title="My Rewards"
      description="Track your session attendance, apple balance, and payout progress."
      icon={Apple}
      fullWidth
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardTitle className="p-3 text-lg">Apples balance</CardTitle>
          <CardContent className="text-3xl font-semibold">{rewards.apples}</CardContent>
        </Card>
        <Card>
          <CardTitle className="p-3 text-lg">Sessions attended</CardTitle>
          <CardContent className="text-3xl font-semibold">
            {rewards.sessionsAttended}
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="p-3 text-lg">Current session value</CardTitle>
          <CardContent className="text-3xl font-semibold">
            {rewards.currentSessionValue}
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="p-3 text-lg">Until next bonus</CardTitle>
          <CardContent className="text-3xl font-semibold">
            {rewards.sessionsUntilNextBonus}
          </CardContent>
        </Card>
      </div>

      <DashboardCard className="mt-4" padding="sm">
        <p className="mb-2 text-sm text-muted-foreground">
          Your code: <span className="font-mono text-foreground">{rewards.code}</span>
          {" · "}
          Pay formula: base {rewards.baseSessionValue}, +{rewards.sessionBonusIncrement} every{" "}
          {rewards.sessionsPerMilestone} sessions
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Sessions</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rewards.events.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">{event.type}</td>
                  <td className="p-3">{event.amount}</td>
                  <td className="p-3">{event.sessionsAttendedAfter ?? "—"}</td>
                  <td className="p-3">{event.reason ?? "—"}</td>
                </tr>
              ))}
              {rewards.events.length === 0 && (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={5}>
                    No payments or attendance events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default MyRewardsPage;
