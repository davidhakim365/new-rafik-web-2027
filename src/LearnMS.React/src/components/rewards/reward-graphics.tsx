import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { Apple, CalendarCheck, ScanLine, Target, TrendingUp } from "lucide-react";
import { CSSProperties, ReactNode } from "react";

type FloatingAppleItem = {
  top: string;
  delay: string;
  size: string;
  opacity: string;
  left?: string;
  right?: string;
};

const floatingApples: FloatingAppleItem[] = [
  { top: "8%", left: "6%", delay: "0s", size: "size-5", opacity: "opacity-20" },
  { top: "18%", right: "10%", delay: "0.8s", size: "size-7", opacity: "opacity-25" },
  { top: "62%", left: "4%", delay: "1.6s", size: "size-4", opacity: "opacity-15" },
  { top: "72%", right: "8%", delay: "2.2s", size: "size-6", opacity: "opacity-20" },
  { top: "40%", right: "3%", delay: "1.1s", size: "size-5", opacity: "opacity-15" },
];

export function FloatingApples({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {floatingApples.map((item, i) => {
        const style: CSSProperties = {
          top: item.top,
          animationDelay: item.delay,
        };
        if (item.left) style.left = item.left;
        if (item.right) style.right = item.right;

        return (
          <Apple
            key={i}
            style={style}
            className={cn(
              "absolute text-emerald-600/40 dark:text-emerald-400/30 animate-float",
              item.size,
              item.opacity
            )}
          />
        );
      })}
    </div>
  );
}

export function RewardHeroBanner({
  title,
  subtitle,
  badge,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background/80 to-color2/10 p-5 shadow-sm sm:p-6",
        className
      )}
    >
      <FloatingApples />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-color2/15 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-color2 text-white shadow-lg shadow-emerald-500/25"
          >
            <Apple className="size-7" />
            <span className="absolute -right-1 -top-1 size-3 rounded-full bg-white/90 animate-pulse" />
          </motion.div>
          <div>
            {badge && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {badge}
              </p>
            )}
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
            {subtitle && (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {children && <div className="relative z-10 flex flex-wrap gap-2">{children}</div>}
      </div>
    </motion.section>
  );
}

export function MilestoneRing({
  sessionsAttended,
  sessionsUntilNextBonus,
  sessionsPerMilestone,
  currentSessionValue,
  className,
}: {
  sessionsAttended: number;
  sessionsUntilNextBonus: number;
  sessionsPerMilestone: number;
  currentSessionValue: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const milestone = Math.max(1, sessionsPerMilestone);
  const progressInCycle = milestone - (sessionsUntilNextBonus % milestone || milestone);
  const pct = Math.min(100, Math.round((progressInCycle / milestone) * 100));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-color2/15 bg-card/80 p-5 backdrop-blur-sm",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--color2)/0.12),transparent_55%)]"
      />
      <div className="relative z-10 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 128 128" className="size-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted/30"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="url(#rewardRing)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={reduceMotion ? false : { strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="rewardRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--color1))" />
                <stop offset="100%" stopColor="rgb(16 185 129)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight">{pct}%</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              to bonus
            </span>
          </div>
        </div>

        <div className="w-full space-y-3 text-center sm:text-start">
          <p className="text-sm font-medium text-muted-foreground">Milestone progress</p>
          <p className="text-lg font-semibold">
            {sessionsUntilNextBonus} session{sessionsUntilNextBonus === 1 ? "" : "s"} until value
            increases
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-color1 to-emerald-500"
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground sm:justify-start">
            <span>{sessionsAttended} sessions attended</span>
            <span>·</span>
            <span>Next session worth {currentSessionValue}</span>
            <span>·</span>
            <span>Every {milestone} sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type RewardStat = {
  label: string;
  value: string | number;
  hint?: string;
  icon: "apples" | "sessions" | "value" | "bonus";
};

const iconMap = {
  apples: Apple,
  sessions: CalendarCheck,
  value: TrendingUp,
  bonus: Target,
};

export function RewardStatGrid({
  stats,
  className,
}: {
  stats: RewardStat[];
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4", className)}>
      {stats.map((stat, i) => {
        const Icon = iconMap[stat.icon];
        return (
          <motion.div
            key={stat.label}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="group relative overflow-hidden rounded-2xl border border-color2/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-emerald-500/10 transition-transform duration-500 group-hover:scale-125"
            />
            <div className="relative z-10 mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-color2/15 text-emerald-700 dark:text-emerald-300">
              <Icon className="size-5" />
            </div>
            <p className="relative z-10 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
            <p className="relative z-10 mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {stat.value}
            </p>
            {stat.hint && (
              <p className="relative z-10 mt-1 text-xs text-color2">{stat.hint}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export function RewardEventTimeline({
  events,
  emptyText = "No reward events yet",
}: {
  events: Array<{
    id: string;
    type: string;
    amount: number;
    sessionsAttendedAfter?: number | null;
    reason?: string | null;
    createdAt: string;
  }>;
  emptyText?: string;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-color2/20 bg-card/50 px-4 py-12 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-color2/10 bg-card/80 backdrop-blur-sm">
      <div className="border-b border-color2/10 bg-gradient-to-r from-emerald-500/10 to-transparent px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold">Reward history</p>
        <p className="text-xs text-muted-foreground">Sessions, payouts, and adjustments</p>
      </div>
      <ul className="divide-y divide-color2/10">
        {events.map((event) => {
          const positive = event.amount >= 0;
          return (
            <li
              key={event.id}
              className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                    event.type === "Payout"
                      ? "bg-color2/15 text-color2"
                      : positive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                  )}
                >
                  <Apple className="size-4" />
                </div>
                <div>
                  <p className="font-medium">
                    {event.type}
                    <span
                      className={cn(
                        "ms-2 font-semibold",
                        positive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600"
                      )}
                    >
                      {positive ? "+" : ""}
                      {event.amount}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.reason || "—"}
                    {event.sessionsAttendedAfter != null
                      ? ` · ${event.sessionsAttendedAfter} sessions`
                      : ""}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground sm:text-end">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Camera overlay: corner brackets + scanning beam */
export function ScannerViewfinder({
  active = true,
  label,
}: {
  active?: boolean;
  label?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="relative h-[46%] w-[72%] max-w-md">
        <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-[3px] border-t-[3px] border-emerald-400/90 shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
        <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-[3px] border-t-[3px] border-emerald-400/90 shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
        <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-[3px] border-l-[3px] border-emerald-400/90 shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
        <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-[3px] border-r-[3px] border-emerald-400/90 shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
        {active && (
          <motion.div
            className="absolute inset-x-3 h-0.5 rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.9)]"
            animate={{ top: ["12%", "88%", "12%"] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        )}
        {label && (
          <div className="absolute -bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] text-emerald-200 backdrop-blur-sm">
            <ScanLine className="size-3" />
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

export function AppleAmountButton({
  amount,
  onClick,
  disabled,
  tone = "add",
}: {
  amount: number;
  onClick: () => void;
  disabled?: boolean;
  tone?: "add" | "remove";
}) {
  const isAdd = tone === "add";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border px-3 py-3 text-center transition active:scale-[0.98] disabled:opacity-50",
        isAdd
          ? "border-emerald-400/40 bg-gradient-to-br from-emerald-500/90 to-emerald-700/90 text-white shadow-lg shadow-emerald-500/25"
          : "border-rose-400/40 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-3 size-12 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-150"
      />
      <Apple
        className={cn(
          "mx-auto mb-1 size-5",
          isAdd ? "text-white/90" : "text-rose-300"
        )}
      />
      <span className="relative z-10 block text-lg font-bold tracking-tight">
        {amount > 0 ? `+${amount}` : amount}
      </span>
    </button>
  );
}

export function RewardAppleBadge({
  apples,
  className,
}: {
  apples: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300",
        className
      )}
    >
      <Apple className="size-3.5" />
      {apples}
    </span>
  );
}
