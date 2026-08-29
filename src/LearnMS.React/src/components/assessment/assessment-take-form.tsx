import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type ChoiceOption = {
  id: string;
  text?: string | null;
  imageUrl?: string | null;
};

export type TakeQuestion = {
  id: string;
  text: string;
  description: string;
  image?: string | null;
  kind: "mc" | "vt" | "essay";
  choices?: ChoiceOption[];
  tolerance?: number;
  maxLength?: number | null;
};

type Props = {
  title: string;
  description?: string;
  questions: TakeQuestion[];
  expiresAt?: string | Date | null;
  expiryMinutes?: number;
  /** When true and timed, show confirm screen before questions. */
  requireStartConfirm?: boolean;
  isSubmitting?: boolean;
  onConfirmStart?: () => Promise<string | Date | null | void> | string | Date | null | void;
  onSubmit: (answers: { questionId: string; answer: string }[]) => void;
};

function normalizeChoices(
  choices: Array<string | ChoiceOption> | undefined
): ChoiceOption[] {
  if (!choices) return [];
  return choices.map((c, i) =>
    typeof c === "string"
      ? { id: c, text: c }
      : { id: c.id || `c${i}`, text: c.text, imageUrl: c.imageUrl }
  );
}

export function buildTakeQuestions(input: {
  multipleChoiceQuestions?: Array<{
    id: string;
    text: string;
    description: string;
    image?: string | null;
    choices: Array<string | ChoiceOption>;
  }>;
  valueToleranceQuestions?: Array<{
    id: string;
    text: string;
    description: string;
    image?: string | null;
    tolerance: number;
  }>;
  essayQuestions?: Array<{
    id: string;
    text: string;
    description: string;
    image?: string | null;
    maxLength?: number | null;
  }>;
}): TakeQuestion[] {
  const mc = (input.multipleChoiceQuestions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    description: q.description,
    image: q.image,
    kind: "mc" as const,
    choices: normalizeChoices(q.choices),
  }));
  const vt = (input.valueToleranceQuestions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    description: q.description,
    image: q.image,
    kind: "vt" as const,
    tolerance: q.tolerance,
  }));
  const essay = (input.essayQuestions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    description: q.description,
    image: q.image,
    kind: "essay" as const,
    maxLength: q.maxLength,
  }));
  return [...mc, ...vt, ...essay];
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function CountdownBanner({
  expiresAt,
  expiryMinutes,
  timedOut,
  isSubmitting,
  onTick,
  onTimeout,
}: {
  expiresAt: string | Date;
  expiryMinutes: number;
  timedOut: boolean;
  isSubmitting: boolean;
  onTick: (leftMs: number) => void;
  onTimeout: () => void;
}) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [urgent, setUrgent] = useState(false);
  const onTickRef = useRef(onTick);
  const onTimeoutRef = useRef(onTimeout);
  onTickRef.current = onTick;
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    if (!Number.isFinite(end)) return;

    const tick = () => {
      const left = end - Date.now();
      onTickRef.current(left);
      if (left > 0) {
        if (labelRef.current && !timedOut) {
          labelRef.current.textContent = `Time left: ${formatTime(left)}`;
        }
        const nextUrgent =
          left <= 60_000 ||
          (expiryMinutes > 0 && left <= expiryMinutes * 60_000 * 0.2);
        setUrgent((prev) => (prev === nextUrgent ? prev : nextUrgent));
        return;
      }
      if (labelRef.current) {
        labelRef.current.textContent = isSubmitting
          ? "Time is up — submitting your answers..."
          : "Time is up — submitting unanswered questions as blank";
      }
      setUrgent(true);
      onTimeoutRef.current();
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [expiresAt, expiryMinutes, timedOut, isSubmitting]);

  return (
    <div
      translate="no"
      className={cn(
        "sticky top-2 z-20 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-lg font-bold shadow-md transition-colors",
        timedOut || urgent
          ? "animate-pulse bg-red-600 text-white"
          : "bg-foreground text-background"
      )}
      role="timer"
      aria-live="off"
    >
      <Clock className="h-5 w-5" />
      <span ref={labelRef} />
    </div>
  );
}

function isFutureDate(value: string | Date | null | undefined) {
  if (value == null || value === "") return false;
  const t = new Date(value).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function collectAnswers(
  questions: TakeQuestion[],
  values: Record<string, unknown>
) {
  return questions.map((q) => {
    const raw = values[q.id];
    if (raw == null || raw === "") {
      return { questionId: q.id, answer: "" };
    }
    return { questionId: q.id, answer: String(raw) };
  });
}

export function AssessmentTakeForm({
  title,
  description,
  questions,
  expiresAt: expiresAtProp,
  expiryMinutes = 0,
  requireStartConfirm = false,
  isSubmitting,
  onConfirmStart,
  onSubmit,
}: Props) {
  const isTimed = expiryMinutes > 0 || isFutureDate(expiresAtProp);
  const [started, setStarted] = useState(
    () => !requireStartConfirm || !isTimed || isFutureDate(expiresAtProp)
  );
  const [starting, setStarting] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | Date | null | undefined>(
    () => (isFutureDate(expiresAtProp) ? expiresAtProp : null)
  );
  const [index, setIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const autoSubmitted = useRef(false);
  const seenRemaining = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  const questionsRef = useRef(questions);
  onSubmitRef.current = onSubmit;
  questionsRef.current = questions;

  useEffect(() => {
    if (isFutureDate(expiresAtProp)) {
      setExpiresAt(expiresAtProp);
      setStarted(true);
      return;
    }
    setExpiresAt(null);
    if (requireStartConfirm) setStarted(false);
  }, [expiresAtProp, requireStartConfirm]);

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const q of questions) {
      if (q.kind === "mc") {
        const ids = (q.choices ?? []).map((c) => c.id);
        shape[q.id] = z.string().refine((v) => ids.includes(v), {
          message: "Select an option",
        });
      } else if (q.kind === "vt") {
        shape[q.id] = z.coerce.number({ invalid_type_error: "Enter a number" });
      } else {
        shape[q.id] = z.string().min(1, "Write your answer");
      }
    }
    return z.object(shape);
  }, [questions]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    shouldUnregister: false,
  });
  const formRef = useRef(form);
  formRef.current = form;

  const handleTimeout = () => {
    if (autoSubmitted.current || !seenRemaining.current) return;
    autoSubmitted.current = true;
    setTimedOut(true);
    formRef.current.clearErrors();
    const values = formRef.current.getValues() as Record<string, unknown>;
    onSubmitRef.current(collectAnswers(questionsRef.current, values));
  };

  const current = questions[index];
  const total = questions.length;
  const progress = total ? ((index + 1) / total) * 100 : 0;
  const locked = timedOut || !!isSubmitting;

  const submitAll = form.handleSubmit((data) => {
    onSubmit(
      collectAnswers(
        questions,
        data as Record<string, unknown>
      )
    );
  });

  const handleStart = async () => {
    setStarting(true);
    try {
      autoSubmitted.current = false;
      seenRemaining.current = false;
      setTimedOut(false);
      const result = await onConfirmStart?.();
      if (isFutureDate(result)) setExpiresAt(result as string | Date);
      else if (expiryMinutes > 0) {
        setExpiresAt(new Date(Date.now() + expiryMinutes * 60_000).toISOString());
      } else {
        setExpiresAt(null);
      }
      setStarted(true);
    } finally {
      setStarting(false);
    }
  };

  if (!started && isTimed) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-background px-4 py-8 dark:from-amber-950/40 dark:to-background">
        <div className="w-full space-y-4 rounded-2xl border border-amber-200 bg-card p-6 text-center text-card-foreground shadow-lg dark:border-amber-500/30">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground">
            This assessment has a <strong className="text-foreground">limited time</strong>
            {expiryMinutes > 0 ? (
              <>
                {" "}
                of <strong className="text-foreground">{expiryMinutes} minutes</strong>
              </>
            ) : null}
            . The timer starts when you tap Start and will auto-submit when time
            runs out.
          </p>
          <p className="text-sm text-muted-foreground">
            Make sure you are ready. You cannot pause once started.
          </p>
          <Button
            className="h-12 w-full text-base"
            disabled={starting}
            onClick={handleStart}
          >
            {starting ? "Starting..." : "I understand — Start"}
          </Button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No questions in this assessment.
      </div>
    );
  }

  return (
    <div
      translate="no"
      className="notranslate mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col bg-gradient-to-b from-muted/40 to-background px-3 py-4 sm:px-6"
    >
      <header className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {started && expiresAt && (
          <CountdownBanner
            expiresAt={expiresAt}
            expiryMinutes={expiryMinutes}
            timedOut={timedOut}
            isSubmitting={!!isSubmitting}
            onTick={(left) => {
              if (left > 0) seenRemaining.current = true;
            }}
            onTimeout={handleTimeout}
          />
        )}

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Question {index + 1} of {total}
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={submitAll} className="flex flex-1 flex-col gap-4">
          <div className="flex-1 rounded-2xl bg-card p-4 text-card-foreground shadow-sm ring-1 ring-border sm:p-6">
            {current.image && (
              <img
                src={current.image}
                alt=""
                className="mb-4 max-h-64 w-full rounded-xl bg-muted object-contain"
              />
            )}
            <h2 className="mb-1 font-heading text-lg font-medium text-foreground">
              {current.text}
            </h2>
            {current.description && current.description !== current.text && (
              <p className="mb-4 text-sm text-muted-foreground">
                {current.description}
              </p>
            )}

            <FormField
              control={form.control}
              name={current.id}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    {current.kind === "mc" ? (
                      <div className="grid gap-2">
                        {(current.choices ?? []).map((c) => {
                          const selected = field.value === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              disabled={locked}
                              onClick={() => field.onChange(c.id)}
                              className={cn(
                                "flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition active:scale-[0.99]",
                                selected
                                  ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15"
                                  : "border-border bg-background hover:border-color2/40"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                  selected
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-muted-foreground/40"
                                )}
                              >
                                {selected && (
                                  <span className="h-2 w-2 rounded-full bg-white" />
                                )}
                              </span>
                              {c.imageUrl && (
                                <img
                                  src={c.imageUrl}
                                  alt=""
                                  className="h-14 w-14 rounded-lg object-cover"
                                />
                              )}
                              <span className="text-base text-foreground">
                                {c.text || (c.imageUrl ? "Image option" : c.id)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : current.kind === "vt" ? (
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        className="h-14 text-lg"
                        placeholder="Enter number"
                        disabled={locked}
                        {...field}
                      />
                    ) : (
                      <Textarea
                        className="min-h-[140px] text-base"
                        placeholder="Write your answer..."
                        maxLength={current.maxLength ?? undefined}
                        disabled={locked}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sticky bottom-0 -mx-3 flex gap-2 border-t border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              disabled={index === 0 || locked}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
            {index < total - 1 ? (
              <Button
                type="button"
                className="h-12 flex-[1.4]"
                disabled={locked}
                onClick={async () => {
                  const ok = await form.trigger(current.id);
                  if (ok) setIndex((i) => i + 1);
                }}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="h-12 flex-[1.4] bg-emerald-600 hover:bg-emerald-700"
                disabled={locked}
              >
                {isSubmitting || timedOut ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
