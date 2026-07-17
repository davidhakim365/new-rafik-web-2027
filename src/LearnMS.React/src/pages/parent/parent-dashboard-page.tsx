import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  LogOut,
  Percent,
  Users,
} from "lucide-react";
import {
  getParentToken,
  getStoredParentStudent,
  useParentLogout,
  useParentProgressQuery,
} from "@/api/parent-api";
import Loading from "@/components/loading/loading";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const levelLabels: Record<string, { en: string; ar: string }> = {
  Level0: { en: "3rd Prep", ar: "ثالثة إعدادي" },
  Level1: { en: "1st Secondary", ar: "أولى ثانوي" },
  Level2: { en: "2nd Secondary", ar: "ثانية ثانوي" },
  Level3: { en: "3rd Secondary", ar: "ثالثة ثانوي" },
};

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function scoreText(
  score: number | null | undefined,
  total?: number | null,
  asPercent = false
) {
  if (score == null) return "—";
  if (asPercent) return `${Number(score).toFixed(1)}%`;
  if (total != null) return `${score} / ${total}`;
  return String(score);
}

const ParentDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const logout = useParentLogout();
  const token = getParentToken();
  const storedStudent = getStoredParentStudent();
  const { data, isLoading, isError } = useParentProgressQuery(!!token);

  useEffect(() => {
    if (!token) {
      navigate("/parent", { replace: true });
    }
  }, [token, navigate]);

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"
      >
        <p className="text-center text-muted-foreground">
          {t("parent.dashboard.loadError")}
        </p>
        <Button onClick={() => navigate("/parent")}>
          {t("parent.login.submit")}
        </Button>
      </div>
    );
  }

  const progress = data.data;
  const student = progress.student;
  const stats = progress.statistics;
  const levelLabel =
    levelLabels[student.level]?.[isRTL ? "ar" : "en"] ?? student.level;

  const statCards = [
    {
      icon: CalendarCheck,
      label: t("parent.dashboard.stats.attendance"),
      value: `${stats.attendedSessions}/${stats.totalSessions}`,
      hint: `${stats.attendanceRate}%`,
    },
    {
      icon: ClipboardList,
      label: t("parent.dashboard.stats.quizzes"),
      value: String(stats.quizCount),
      hint:
        stats.averageQuizScorePercent != null
          ? `${stats.averageQuizScorePercent}%`
          : "—",
    },
    {
      icon: GraduationCap,
      label: t("parent.dashboard.stats.exams"),
      value: String(stats.examCount),
      hint:
        stats.averageExamScorePercent != null
          ? `${stats.averageExamScorePercent}%`
          : "—",
    },
    {
      icon: Percent,
      label: t("parent.dashboard.stats.avgExam"),
      value:
        stats.averageExamScorePercent != null
          ? `${stats.averageExamScorePercent}%`
          : "—",
      hint: t("parent.dashboard.stats.overall"),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/parent");
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-hero via-background to-featuresSection"
    >
      <header className="sticky top-0 z-40 border-b border-color2/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-color2/15 bg-background/80 text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className={cn("size-4", isRTL && "rotate-180")} />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wider text-color2">
                {t("parent.dashboard.badge")}
              </p>
              <Heading className="truncate text-lg font-bold sm:text-xl">
                {student.fullName || storedStudent?.fullName}
              </Heading>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 rounded-xl"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("parent.dashboard.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-color2/15 bg-background/80 p-5 shadow-sm backdrop-blur-sm sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-color1 to-color2 text-white">
                <Users className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{student.fullName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("parent.dashboard.studentId")}:{" "}
                  <span className="font-medium text-foreground">
                    {student.studentCode}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {student.schoolName}
                </p>
              </div>
            </div>
            <Badge className="w-fit rounded-full bg-color2/10 px-3 py-1 text-color2 hover:bg-color2/15">
              {levelLabel}
            </Badge>
          </div>
        </motion.section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {statCards.map(({ icon: Icon, label, value, hint }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-2xl border border-color2/10 bg-background/70 p-4 backdrop-blur-sm sm:p-5"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-color2/10 text-color2">
                <Icon className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
              <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                {value}
              </p>
              <p className="mt-0.5 text-xs text-color2">{hint}</p>
            </motion.div>
          ))}
        </section>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-color2/5 p-1">
            <TabsTrigger value="attendance" className="flex-1 min-w-[7rem] gap-1.5 sm:flex-none">
              <CalendarCheck className="size-3.5" />
              {t("parent.dashboard.tabs.attendance")}
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex-1 min-w-[7rem] gap-1.5 sm:flex-none">
              <ClipboardList className="size-3.5" />
              {t("parent.dashboard.tabs.quizzes")}
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex-1 min-w-[7rem] gap-1.5 sm:flex-none">
              <GraduationCap className="size-3.5" />
              {t("parent.dashboard.tabs.exams")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <DataPanel empty={progress.attendance.length === 0} emptyText={t("parent.dashboard.empty.attendance")}>
              <ul className="divide-y divide-color2/10">
                {progress.attendance.map((item) => (
                  <li
                    key={item.lectureId}
                    className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{item.lectureTitle}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BookOpen className="size-3.5 shrink-0" />
                        <span className="truncate">{item.courseTitle}</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full",
                          item.attended
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        )}
                      >
                        {item.attended
                          ? t("parent.dashboard.attended")
                          : t("parent.dashboard.absent")}
                      </Badge>
                      {item.attendedAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.attendedAt, i18n.language)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </DataPanel>
          </TabsContent>

          <TabsContent value="quizzes">
            <DataPanel empty={progress.quizGrades.length === 0} emptyText={t("parent.dashboard.empty.quizzes")}>
              <ul className="divide-y divide-color2/10">
                {progress.quizGrades.map((item) => (
                  <li
                    key={item.lectureId}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{item.lectureTitle}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.courseTitle}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-[14rem]">
                      <GradeChip
                        label={t("parent.dashboard.offlineQuiz")}
                        value={scoreText(item.offlineQuizScore)}
                      />
                      <GradeChip
                        label={t("parent.dashboard.homework")}
                        value={scoreText(item.homeworkScore)}
                      />
                      <GradeChip
                        label={t("parent.dashboard.onlineQuiz")}
                        value={scoreText(item.onlineCorrect, item.onlineTotal)}
                        className="col-span-2"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </DataPanel>
          </TabsContent>

          <TabsContent value="exams">
            <DataPanel empty={progress.examGrades.length === 0} emptyText={t("parent.dashboard.empty.exams")}>
              <ul className="divide-y divide-color2/10">
                {progress.examGrades.map((item) => (
                  <li
                    key={item.examId}
                    className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.courseTitle}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(item.submittedAt, i18n.language)}
                      </p>
                    </div>
                    <div className="text-start sm:text-end">
                      <p className="text-lg font-bold">
                        {scoreText(item.studentScore, item.totalScore)}
                      </p>
                      {item.totalScore != null &&
                        item.studentScore != null &&
                        item.totalScore > 0 && (
                          <p className="text-xs text-color2">
                            {scoreText(
                              (item.studentScore / item.totalScore) * 100,
                              null,
                              true
                            )}
                          </p>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            </DataPanel>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function DataPanel({
  children,
  empty,
  emptyText,
}: {
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
}) {
  return (
    <div className="rounded-3xl border border-color2/10 bg-background/80 p-4 backdrop-blur-sm sm:p-6">
      {empty ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

function GradeChip({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-color2/10 bg-color2/5 px-3 py-2",
        className
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

export default ParentDashboardPage;
