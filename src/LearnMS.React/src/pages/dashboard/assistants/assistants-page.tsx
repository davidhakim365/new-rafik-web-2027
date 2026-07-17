import { useAssistantsQuery } from "@/api/assistants-api";
import { usePayAssistantRewardsMutation } from "@/api/rewards-api";
import Confirmation from "@/components/confirmation";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import Loading from "@/components/loading/loading";
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
import { Assistant } from "@/types/assistants";
import { Edit2, Plus, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const AssistantsPage = () => {
  const { data: assistants, isLoading } = useAssistantsQuery();
  const { openModal } = useModalStore();
  const { isTeacher } = useDashboardPermissions();
  const payMutation = usePayAssistantRewardsMutation();

  if (isLoading) {
    return <Loading />;
  }

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
      actions={
        <div className="flex flex-wrap gap-2">
          {isTeacher && (
            <>
              <Button asChild variant="outline">
                <Link to="/dashboard/assistant-rewards-scanner">Reward scanner</Link>
              </Button>
              <Confirmation
                button={
                  <Button variant="secondary" disabled={payMutation.isPending}>
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
      <div className="grid gap-4">
        {assistants?.data!.items!.map((assistant) => (
          <AssistantListItem key={assistant.id} assistant={assistant} />
        ))}
      </div>
    </DashboardPageShell>
  );
};

function AssistantListItem({ assistant }: { assistant: Assistant }) {
  return (
    <DashboardCard padding="sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-color1 to-color2 text-white shadow-md shadow-color2/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{assistant.email}</p>
            <p className="text-sm text-muted-foreground">
              Code {assistant.code || "—"} · {assistant.apples ?? 0} apples ·{" "}
              {assistant.sessionsAttended ?? 0} sessions ·{" "}
              {assistant.permissions?.length ?? 0} permissions
            </p>
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
