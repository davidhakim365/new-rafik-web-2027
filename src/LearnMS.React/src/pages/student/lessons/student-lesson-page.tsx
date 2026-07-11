import {
  useLessonsQuery,
  useRenewLessonMutation,
  useStartLessonMutation,
} from "@/api/lessons-api";
import Confirmation from "@/components/confirmation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Coins,
  Play,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const StudentLessonPage = () => {
  const { lessonId, lectureId, courseId } = useParams();
  const { t } = useTranslation();

  const { data, isLoading, error } = useLessonsQuery({
    lessonId: lessonId!,
    lectureId: lectureId!,
    courseId: courseId!,
  });

  const startLessonMutation = useStartLessonMutation();
  const renewLessonMutation = useRenewLessonMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16 bg-gradient-to-br from-background via-background to-muted/10">
        <div className="w-full max-w-md px-4 space-y-6 text-center">
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10 animate-pulse">
              <Play className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto border-2 rounded-full border-primary/20 animate-spin border-t-primary"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Loading lesson content
            </h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we prepare your lesson...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-16 bg-gradient-to-br from-background via-background to-muted/10">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="p-8 space-y-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-destructive/10">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
            <Link
              to={`/courses/${courseId}/lectures/${lectureId}`}
              className="block"
            >
              <Button className="w-full transition-all shadow-lg hover:scale-105 bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("lesson.back")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onStarting = () => {
    startLessonMutation.mutate({
      courseId: courseId!,
      lectureId: lectureId!,
      lessonId: lessonId!,
    });
  };

  const onRenewing = () => {
    renewLessonMutation.mutate({
      courseId: courseId!,
      lectureId: lectureId!,
      lessonId: lessonId!,
    });
  };

  if (data?.data.enrollment === "NotEnrolled") {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 pt-16 bg-gradient-to-br from-background via-background to-muted/10">
        <Card className="w-full max-w-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-primary/10">
                <Play className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold md:text-3xl text-foreground">
                {t("lesson.startLessonTitle")}
              </h1>
              <div className="max-w-xl mx-auto">
                <p className="leading-relaxed text-muted-foreground">
                  {t("lesson.startLessonConfirmation", {
                    hours: data.data.expirationHours,
                  })}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 mt-3 border rounded-full bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    {data.data.renewalPrice} {t("common.currency")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Confirmation
                title={t("lesson.startLessonConfirmationTitle")}
                description={t("lesson.startLessonConfirmationDescription")}
                onConfirm={onStarting}
                button={
                  <Button
                    size="lg"
                    className="px-8 transition-all shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t("lesson.start")}
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data?.data.enrollment === "Expired") {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 pt-16 bg-gradient-to-br from-background via-background to-muted/10">
        <Card className="w-full max-w-2xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold md:text-3xl text-foreground">
                {t("lesson.lessonExpiredTitle")}
              </h1>
              <div className="max-w-xl mx-auto">
                <p className="leading-relaxed text-muted-foreground">
                  {t("lesson.lessonExpiredMessage")}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 mt-3 border rounded-full bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700">
                  <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    {data.data.renewalPrice} {t("common.currency")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Confirmation
                title={t("lesson.renewLessonConfirmationTitle")}
                description={t("lesson.renewLessonConfirmationDescription", {
                  price: `${data.data.renewalPrice} ${t("common.currency")}`,
                })}
                onConfirm={onRenewing}
                button={
                  <Button
                    size="lg"
                    className="px-8 text-white transition-all shadow-lg bg-amber-600 hover:bg-amber-700 hover:scale-105"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t("lesson.renew")}
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  data!.data.videoStatus = "Ready";
  if (data?.data.videoStatus !== "Ready") return null;

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container max-w-6xl px-4 py-8 mx-auto">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold leading-tight md:text-4xl text-foreground">
                {data?.data.title}
              </h1>
              <p className="text-muted-foreground">Lesson Content</p>
            </div>
            {data.data.expiresAt != null && (
              <Badge
                variant="outline"
                className="self-start px-4 py-2 sm:self-center border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
              >
                <Clock className="w-4 h-4 mr-2" />
                {t("lesson.expiresAt")}{" "}
                {new Date(data!.data.expiresAt).toLocaleString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Video Section */}
        <div className="mb-8">
          <Card className="overflow-hidden bg-black border-0 shadow-2xl">
            <div className="w-full aspect-video">
              <iframe
                src={`https://player.vdocipher.com/v2/?otp=${data?.data.videoOTP.otp}&playbackInfo=${data?.data.videoOTP.playbackInfo}`}
                allowFullScreen
                className="w-full h-full"
                allow="encrypted-media"
              ></iframe>
            </div>
          </Card>
        </div>

        {/* Description Section */}
        <Card className="border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Lesson Description
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                {data?.data.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentLessonPage;
