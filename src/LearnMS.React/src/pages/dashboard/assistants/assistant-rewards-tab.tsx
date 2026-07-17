import {
  AdjustAssistantApplesRequest,
  useAdjustAssistantApplesMutation,
  useAssistantRewardsQuery,
  useAttendAssistantSessionMutation,
  usePayAssistantRewardsMutation,
} from "@/api/rewards-api";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardTitle className="p-3 text-lg">Apples</CardTitle>
          <CardContent className="text-3xl font-semibold">{rewards.apples}</CardContent>
        </Card>
        <Card>
          <CardTitle className="p-3 text-lg">Sessions</CardTitle>
          <CardContent className="text-3xl font-semibold">
            {rewards.sessionsAttended}
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="p-3 text-lg">Next session value</CardTitle>
          <CardContent className="text-3xl font-semibold">
            {rewards.currentSessionValue}
          </CardContent>
        </Card>
        <Card>
          <CardTitle className="p-3 text-lg">Until bonus</CardTitle>
          <CardContent className="text-3xl font-semibold">
            {rewards.sessionsUntilNextBonus}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Code: <span className="font-mono text-foreground">{rewards.code}</span>
        {" · "}
        Base {rewards.baseSessionValue} + {rewards.sessionBonusIncrement} every{" "}
        {rewards.sessionsPerMilestone} sessions
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onAttend} disabled={attendMutation.isPending}>
          Attend session
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard/assistant-rewards-scanner">Scan / type code</Link>
        </Button>
        <Confirmation
          button={
            <Button variant="secondary" disabled={payMutation.isPending || rewards.apples <= 0}>
              Pay rewards
            </Button>
          }
          title="Pay this assistant's rewards?"
          description={`This resets ${rewards.apples} apples to 0 and logs a payout. Sessions attended stay the same.`}
          onConfirm={onPay}
        />
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onAdjust)}
          className="grid max-w-xl gap-3 rounded-lg border p-4"
        >
          <p className="font-medium">Manual apple adjust</p>
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={adjustMutation.isPending}>
            Apply
          </Button>
        </form>
      </Form>

      <div className="overflow-x-auto rounded-lg border">
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
                  No reward events yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
