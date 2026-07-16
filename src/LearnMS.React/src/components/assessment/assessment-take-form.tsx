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
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  isSubmitting?: boolean;
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

export function AssessmentTakeForm({
  title,
  description,
  questions,
  expiresAt,
  isSubmitting,
  onSubmit,
}: Props) {
  const [index, setIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

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
  });

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null);
      return;
    }
    const end = new Date(expiresAt).getTime();
    const tick = () => {
      const left = end - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= 0) {
        form.handleSubmit((data) => {
          onSubmit(
            Object.entries(data).map(([questionId, answer]) => ({
              questionId,
              answer: String(answer),
            }))
          );
        })();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const current = questions[index];
  const total = questions.length;
  const progress = total ? ((index + 1) / total) * 100 : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  const submitAll = form.handleSubmit((data) => {
    onSubmit(
      Object.entries(data).map(([questionId, answer]) => ({
        questionId,
        answer: String(answer),
      }))
    );
  });

  if (!current) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No questions in this assessment.
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col bg-gradient-to-b from-slate-50 to-white px-3 py-4 sm:px-6">
      <header className="mb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          {remainingMs != null && (
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
                remainingMs < 60_000
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              <Clock className="h-4 w-4" />
              {formatTime(remainingMs)}
            </div>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          Question {index + 1} of {total}
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={submitAll} className="flex flex-1 flex-col gap-4">
          <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:p-6">
            {current.image && (
              <img
                src={current.image}
                alt=""
                className="mb-4 max-h-64 w-full rounded-xl object-contain bg-slate-50"
              />
            )}
            <h2 className="mb-1 text-lg font-medium text-slate-900">
              {current.text}
            </h2>
            {current.description && current.description !== current.text && (
              <p className="mb-4 text-sm text-slate-500">
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
                              onClick={() => field.onChange(c.id)}
                              className={cn(
                                "flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition active:scale-[0.99]",
                                selected
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                  selected
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-slate-300"
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
                              <span className="text-base text-slate-800">
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
                        {...field}
                      />
                    ) : (
                      <Textarea
                        className="min-h-[140px] text-base"
                        placeholder="Write your answer..."
                        maxLength={current.maxLength ?? undefined}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sticky bottom-0 -mx-3 flex gap-2 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
            {index < total - 1 ? (
              <Button
                type="button"
                className="h-12 flex-[1.4]"
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
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
