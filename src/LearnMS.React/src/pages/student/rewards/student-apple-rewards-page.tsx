import {
  useAppleStoreCatalogQuery,
  useCancelAppleStoreOrderMutation,
  useRedeemAppleStoreItemMutation,
} from "@/api/rewards-api";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils";
import { Apple, Gift, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const StudentAppleRewardsPage = () => {
  const { data, isLoading, isError } = useAppleStoreCatalogQuery();
  const redeemMutation = useRedeemAppleStoreItemMutation();
  const cancelMutation = useCancelAppleStoreOrderMutation();

  if (isLoading) return <Loading />;

  if (isError || !data?.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Gift className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Apple Rewards</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load the store. Please try again later.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  const catalog = data.data;

  if (!catalog.isOpen) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Apple Rewards is closed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The exchange page opens only during the time your teacher sets. Check
          back later.
        </p>
        {catalog.myOrders.length > 0 && (
          <div className="mt-8 rounded-2xl border border-color2/15 bg-card p-4 text-left">
            <p className="mb-3 text-sm font-semibold">Your last choices</p>
            <ul className="space-y-2">
              {catalog.myOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{order.itemTitle}</span>
                  <span className="text-muted-foreground">
                    {order.appleCost} apples
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button asChild className="mt-6" variant="outline">
          <Link to="/">Back home</Link>
        </Button>
      </div>
    );
  }

  const onChoose = (itemId: string, title: string) => {
    redeemMutation.mutate(itemId, {
      onSuccess: (res) => {
        toast({
          title: "Chosen!",
          description: res.message ?? `You chose ${title}`,
        });
      },
    });
  };

  const onRemove = (orderId: string, title: string) => {
    cancelMutation.mutate(orderId, {
      onSuccess: (res) => {
        toast({
          title: "Removed",
          description: res.message ?? `${title} removed and apples refunded`,
        });
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              Open now
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Apple Rewards
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Choose items with your apples. You can change your choices anytime
            while the store is open.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs text-muted-foreground">Your balance</p>
          <p className="flex items-center gap-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            <Apple className="size-6" />
            {catalog.apples}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Available items</h2>
          {catalog.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-color2/20 px-4 py-12 text-center text-sm text-muted-foreground">
              No items available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.items.map((item) => {
                const canAfford = catalog.apples >= item.appleCost;
                const busy = redeemMutation.isPending;
                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-color2/10 bg-card shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-muted">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-3 p-4">
                      <div>
                        <h3 className="font-semibold leading-tight">
                          {item.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-300">
                          <Apple className="size-4" />
                          {item.appleCost} apples
                        </p>
                      </div>
                      <Button
                        className="w-full"
                        disabled={!canAfford || busy}
                        onClick={() => onChoose(item.id, item.title)}
                      >
                        {busy ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : null}
                        {canAfford ? "Choose" : "Not enough apples"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-color2/15 bg-card p-4 shadow-sm lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">My choices</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Preview of what you picked. Remove to get apples back and choose
            something else.
          </p>
          <p className="mt-3 text-sm">
            Spent on choices:{" "}
            <span className="font-semibold">
              {catalog.applesSpentOnActiveOrders}
            </span>{" "}
            apples
          </p>

          {catalog.myOrders.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-color2/20 px-3 py-8 text-center text-sm text-muted-foreground">
              You have not chosen any items yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {catalog.myOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex gap-3 rounded-xl border border-color2/10 p-2"
                >
                  {order.itemImageUrl ? (
                    <img
                      src={order.itemImageUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Gift className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {order.itemTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.appleCost} apples
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-8 px-2 text-destructive"
                      disabled={cancelMutation.isPending}
                      onClick={() => onRemove(order.id, order.itemTitle)}
                    >
                      <Trash2 className="mr-1 size-3.5" />
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
};

export default StudentAppleRewardsPage;
