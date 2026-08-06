import {
  checkStudentAvailability,
  CreateStudentRequest,
  useCreateStudentMutation,
} from "@/api/students-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Loader2, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

const STEPS = [
  { id: 0, title: "Study mode", description: "Online or offline ID" },
  { id: 1, title: "Student info", description: "Name, phones, school" },
  { id: 2, title: "Account", description: "Email and password" },
  { id: 3, title: "Review", description: "Confirm before create" },
] as const;

const LAST_INPUT_STEP = 2;

const LEVEL_LABELS: Record<string, string> = {
  Level0: "3rd Prep",
  Level1: "1st Secondary",
  Level2: "2nd Secondary",
  Level3: "3rd Secondary",
  Level4: "3rd Secondary Adby",
};

const defaultValues: CreateStudentRequest = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  level: "Level0",
  school: "",
  parentPhoneNumber: "",
  studentCode: "",
  phoneNumber: "",
  mode: "offline",
};

const generateStudentCode = () => {
  return `ONL-${Math.floor(100000 + Math.random() * 900000)}`;
};

const stepFields: Record<number, (keyof CreateStudentRequest)[]> = {
  0: ["mode", "studentCode"],
  1: ["fullName", "phoneNumber", "parentPhoneNumber", "school", "level"],
  2: ["email", "password", "confirmPassword"],
  3: [],
};

type LastCreated = {
  fullName: string;
  studentCode: string;
  mode: "online" | "offline";
};

const AddStudentsPage = () => {
  const createStudentMutation = useCreateStudentMutation();
  const [step, setStep] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [lastCreated, setLastCreated] = useState<LastCreated | null>(null);
  const firstFieldRef = useRef<HTMLButtonElement | null>(null);

  const form = useForm<CreateStudentRequest>({
    resolver: zodResolver(CreateStudentRequest),
    defaultValues,
    mode: "onTouched",
  });

  const mode = form.watch("mode");
  const previewValues = form.watch();
  const isBusy = createStudentMutation.isPending || checkingAvailability;

  useEffect(() => {
    if (step === 0) {
      firstFieldRef.current?.focus();
    }
  }, [step, lastCreated]);

  const goNext = async () => {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true });
    if (!valid) return;

    const values = form.getValues();

    try {
      setCheckingAvailability(true);

      if (step === 0 && values.mode === "offline" && values.studentCode) {
        const availability = await checkStudentAvailability({
          studentCode: values.studentCode.trim(),
        });
        if (availability?.studentCodeTaken) {
          form.setError("studentCode", {
            type: "manual",
            message: "ID already assigned with another account",
          });
          return;
        }
      }

      if (step === 1 && values.phoneNumber) {
        const availability = await checkStudentAvailability({
          phoneNumber: values.phoneNumber.trim(),
        });
        if (availability?.phoneNumberTaken) {
          form.setError("phoneNumber", {
            type: "manual",
            message: "Phone number already assigned with another account",
          });
          return;
        }
      }

      if (step === LAST_INPUT_STEP && values.email) {
        const availability = await checkStudentAvailability({
          email: values.email.trim(),
        });
        if (availability?.emailTaken) {
          form.setError("email", {
            type: "manual",
            message: "Email already exists",
          });
          return;
        }
      }
    } catch {
      return;
    } finally {
      setCheckingAvailability(false);
    }

    if (
      step === LAST_INPUT_STEP &&
      values.mode === "online" &&
      !values.studentCode?.startsWith("ONL-")
    ) {
      form.setValue("studentCode", generateStudentCode(), {
        shouldDirty: true,
      });
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const resetForNext = () => {
    form.reset(defaultValues);
    setStep(0);
    requestAnimationFrame(() => firstFieldRef.current?.focus());
  };

  const onSubmit = async (data: CreateStudentRequest) => {
    if (step !== STEPS.length - 1) return;

    const studentCode =
      data.mode === "online"
        ? data.studentCode?.trim() || generateStudentCode()
        : data.studentCode ?? "";

    try {
      setCheckingAvailability(true);
      const availability = await checkStudentAvailability({
        studentCode: data.mode === "offline" ? studentCode : undefined,
        phoneNumber: data.phoneNumber.trim(),
        email: data.email.trim(),
      });

      if (availability?.studentCodeTaken) {
        form.setError("studentCode", {
          type: "manual",
          message: "ID already assigned with another account",
        });
        setStep(0);
        return;
      }

      if (availability?.phoneNumberTaken) {
        form.setError("phoneNumber", {
          type: "manual",
          message: "Phone number already assigned with another account",
        });
        setStep(1);
        return;
      }

      if (availability?.emailTaken) {
        form.setError("email", {
          type: "manual",
          message: "Email already exists",
        });
        setStep(2);
        return;
      }
    } catch {
      return;
    } finally {
      setCheckingAvailability(false);
    }

    createStudentMutation.mutate(
      {
        ...data,
        studentCode,
      },
      {
        onSuccess: () => {
          setLastCreated({
            fullName: data.fullName,
            studentCode,
            mode: data.mode,
          });
          toast({
            title: "Student created",
            description: `${data.fullName} · ID ${studentCode}`,
          });
          resetForNext();
        },
      }
    );
  };

  return (
    <DashboardPageShell
      title="Add Students"
      description="Enroll students quickly — the form resets after each success so you can keep going."
      icon={UserPlus}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {lastCreated && (
          <DashboardCard className="border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-emerald-500/15 p-1.5 text-emerald-700 dark:text-emerald-300">
                <Check className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Last created: {lastCreated.fullName}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID {lastCreated.studentCode}
                  {" · "}
                  {lastCreated.mode === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </DashboardCard>
        )}

        <DashboardCard>
          <ol className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((s) => {
              const active = step === s.id;
              const done = step > s.id;
              return (
                <li
                  key={s.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-center transition-colors",
                    active && "border-color2/40 bg-color2/10",
                    done && "border-emerald-500/30 bg-emerald-500/5",
                    !active && !done && "border-border/60"
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    Step {s.id + 1}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {s.title}
                  </p>
                </li>
              );
            })}
          </ol>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <fieldset disabled={isBusy} className="space-y-4">
                {step === 0 && (
                  <>
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Study Mode</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger ref={firstFieldRef}>
                                <SelectValue placeholder="Select study mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="offline">Offline</SelectItem>
                              <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Online students get an ID automatically (ONL-######).
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {mode === "offline" && (
                      <FormField
                        control={form.control}
                        name="studentCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="At least 6 characters"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input autoFocus {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="parentPhoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="school"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Level0">3rd Prep</SelectItem>
                              <SelectItem value="Level1">
                                1st Secondary
                              </SelectItem>
                              <SelectItem value="Level2">
                                2nd Secondary
                              </SelectItem>
                              <SelectItem value="Level3">
                                3rd Secondary
                              </SelectItem>
                              <SelectItem value="Level4">
                                3rd Secondary Adby
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" autoFocus {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        Review student details
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Confirm everything looks right before creating the account.
                      </p>
                    </div>
                    <dl className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                      {(
                        [
                          {
                            label: "Study mode",
                            value:
                              previewValues.mode === "online"
                                ? "Online"
                                : "Offline",
                          },
                          {
                            label: "Student ID",
                            value:
                              previewValues.mode === "online"
                                ? previewValues.studentCode ||
                                  "Will be assigned automatically"
                                : previewValues.studentCode,
                          },
                          {
                            label: "Full name",
                            value: previewValues.fullName,
                          },
                          {
                            label: "Phone number",
                            value: previewValues.phoneNumber,
                          },
                          {
                            label: "Parent phone",
                            value: previewValues.parentPhoneNumber,
                          },
                          {
                            label: "School",
                            value: previewValues.school,
                          },
                          {
                            label: "Level",
                            value:
                              LEVEL_LABELS[previewValues.level] ??
                              previewValues.level,
                          },
                          {
                            label: "Email",
                            value: previewValues.email,
                          },
                          {
                            label: "Password",
                            value: "••••••••",
                          },
                        ] as const
                      ).map((item) => (
                        <div
                          key={item.label}
                          className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4"
                        >
                          <dt className="text-sm text-muted-foreground">
                            {item.label}
                          </dt>
                          <dd className="break-words text-sm font-medium text-foreground">
                            {item.value || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-xs text-muted-foreground">
                      Use Back to edit any field before creating the student.
                    </p>
                  </div>
                )}
              </fieldset>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 0 || isBusy}
                  className="border-color2/20"
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Back
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={isBusy}
                    className="bg-gradient-to-r from-color1 to-color2 hover:opacity-90"
                  >
                    {checkingAvailability ? (
                      <>
                        <Loader2 className="mr-1 size-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="ml-1 size-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isBusy}
                    className="bg-gradient-to-r from-color1 to-color2 hover:opacity-90"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="mr-1 size-4 animate-spin" />
                        {checkingAvailability ? "Checking..." : "Creating..."}
                      </>
                    ) : (
                      "Create student"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </DashboardCard>
      </div>
    </DashboardPageShell>
  );
};

export default AddStudentsPage;
