import { useAssistantsQuery } from "@/api/assistants-api";
import { usePayAssistantRewardsMutation } from "@/api/rewards-api";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
import {
  RewardAppleBadge,
  RewardHeroBanner,
  RewardStatGrid,
} from "@/components/rewards/reward-graphics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import { toast } from "@/lib/utils";
import { useModalStore } from "@/store/use-modal-store";
import { Assistant, assistantDisplayName } from "@/types/assistants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Apple, Edit2, Plus, QrCode, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const AssistantsPage = () => {
  const { data: assistants, isLoading } = useAssistantsQuery();
  const { openModal } = useModalStore();
  const { isTeacher } = useDashboardPermissions();
  const payMutation = usePayAssistantRewardsMutation();

  if (isLoading) {
    return <Loading />;
  }

  const items = assistants?.data?.items ?? [];
  const totalApples = items.reduce((sum, a) => sum + (a.apples ?? 0), 0);
  const totalSessions = items.reduce((sum, a) => sum + (a.sessionsAttended ?? 0), 0);
  const withBalance = items.filter((a) => (a.apples ?? 0) > 0).length;

  const onPayAll = () => {
    payMutation.mutate(
      {},
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

  return (
    <DashboardPageShell
      title="Assistants"
      description="Manage teaching assistants, permissions, and reward payouts."
      icon={Shield}
      decorative
      actions={
        <div className="flex flex-wrap gap-2">
          {isTeacher && (
            <>
              <Button
                asChild
                variant="outline"
                className="gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
              >
                <Link to="/dashboard/assistant-rewards-scanner">
                  <QrCode className="size-4" />
                  Reward scanner
                </Link>
              </Button>
              <Confirmation
                button={
                  <Button
                    variant="secondary"
                    disabled={payMutation.isPending || totalApples <= 0}
                    className="gap-2"
                  >
                    <Apple className="size-4" />
                    Pay all rewards
                  </Button>
                }
                title="Pay all assistant rewards?"
                description="This resets every assistant apple balance to 0 and logs payouts. Sessions attended stay the same."
                onConfirm={onPayAll}
              />
            </>
          )}
          <Button
            onClick={() => openModal("add-assistant-modal")}
            className="bg-gradient-to-r from-color1 to-color2 shadow-md shadow-color2/20 hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Assistant
          </Button>
        </div>
      }
    >
      {isTeacher && (
        <div className="space-y-4">
          <RewardHeroBanner
            badge="Apple reward system"
            title="Assistant pay overview"
            subtitle="Track apple balances, session attendance, and payouts. Scan barcodes to mark attendance in one tap."
          >
            <Button
              asChild
              className="gap-2 bg-gradient-to-r from-emerald-600 to-color2 text-white shadow-md shadow-emerald-500/20"
            >
              <Link to="/dashboard/assistant-rewards-scanner">
                <QrCode className="size-4" />
                Open scanner
              </Link>
            </Button>
          </RewardHeroBanner>

          <RewardStatGrid
            stats={[
              {
                label: "Assistants",
                value: items.length,
                hint: "On the roster",
                icon: "sessions",
              },
              {
                label: "Apples outstanding",
                value: totalApples,
                hint: "Ready to pay",
                icon: "apples",
              },
              {
                label: "With balance",
                value: withBalance,
                hint: "Awaiting payout",
                icon: "bonus",
              },
              {
                label: "Sessions logged",
                value: totalSessions,
                hint: "All assistants",
                icon: "value",
              },
            ]}
          />
        </div>
      )}

      <div className="grid gap-4">
        {items.map((assistant) => (
          <AssistantListItem key={assistant.id} assistant={assistant} />
        ))}
      </div>
    </DashboardPageShell>
  );
};

function AssistantListItem({ assistant }: { assistant: Assistant }) {
  const name = assistantDisplayName(assistant);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <DashboardCard padding="sm" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-emerald-500/10"
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-emerald-500/20 shadow-md shadow-emerald-500/10">
            <AvatarImage src={assistant.profilePicture ?? undefined} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-color2 text-white">
              {initials || <Shield className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{assistant.email}</span>
              <span>·</span>
              <span>Code {assistant.code || "—"}</span>
              <RewardAppleBadge apples={assistant.apples ?? 0} />
              <span>{assistant.sessionsAttended ?? 0} sessions</span>
              <span>·</span>
              <span>{assistant.permissions?.length ?? 0} permissions</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline" size="sm" className="border-color2/20">
                Permissions
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit space-y-1">
              {assistant.permissions?.map((permission) => (
                <Badge
                  key={permission}
                  variant="secondary"
                  className="mr-1 bg-color2/10 text-color2"
                >
                  {permission}
                </Badge>
              ))}
            </HoverCardContent>
          </HoverCard>
          <Link to={`/dashboard/assistants/${assistant.id}`}>
            <Button size="icon" variant="outline" className="border-color2/20">
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}

export default AssistantsPage;
