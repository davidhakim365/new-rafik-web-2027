import {
  AttendLectureResult,
  getLectureStatisticsParams,
  readCompareChooseHomeworkLectureId,
  readSelectedCenterId,
  useAttendLectureAtCenter,
  useGetCenters,
} from "@/api/centers-api";
import { Button } from "@/components/ui/button";
import {
  getGetLectureStudentsQueryKey,
  getGetLectureStatisticsQueryKey,
} from "@/generated/api";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { normalizeScannedCode } from "@/lib/scan-code";
import { playScanSuccessVoice } from "@/lib/scan-feedback";
import { toast } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2, ScanLine, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const SCAN_COOLDOWN_MS = 2500;

const LectureBarcodeScannerPage = () => {
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const processingRef = useRef(false);
  const lastCodeRef = useRef("");
  const lastScanTimeRef = useRef(0);

  const [status, setStatus] = useState<
    "initializing" | "scanning" | "processing" | "success" | "error"
  >("initializing");
  const [feedback, setFeedback] = useState("");
  const [lastAttend, setLastAttend] = useState<AttendLectureResult | null>(null);
  const centerId = readSelectedCenterId();
  const compareChooseHomeworkLectureId = lectureId
    ? readCompareChooseHomeworkLectureId(lectureId)
    : null;
  const { data: centersData } = useGetCenters();
  const centerName =
    centersData?.data?.find((center) => center.id === centerId)?.name ??
    "No center selected";

  const { mutate: attendLecture } = useAttendLectureAtCenter({
    mutation: { throwOnError: false },
  });

  const goBack = () => {
    navigate(`/dashboard/courses/${courseId}/lectures/${lectureId}/students`);
  };

  const resumeScanning = useCallback((delay = 1500) => {
    window.setTimeout(() => {
      processingRef.current = false;
      setStatus("scanning");
      setFeedback("Ready for next scan...");
    }, delay);
  }, []);

  const handleScan = useCallback(
    (rawCode: string) => {
      const code = normalizeScannedCode(rawCode);
      if (!code || !courseId || !lectureId) return;

      if (!centerId) {
        setStatus("error");
        setFeedback("Select an attendance center before scanning.");
        toast({
          title: "No center selected",
          description: "Go back and choose a center first.",
          variant: "destructive",
        });
        resumeScanning(2500);
        return;
      }

      const now = Date.now();
      if (processingRef.current) return;
      if (code === lastCodeRef.current && now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
        return;
      }

      processingRef.current = true;
      lastCodeRef.current = code;
      lastScanTimeRef.current = now;
      setStatus("processing");
      setFeedback(`Processing: ${code}`);

      attendLecture(
        {
          courseId,
          lectureId,
          code,
          centerId,
          compareChooseHomeworkLectureId,
        },
        {
          onSuccess: (data) => {
            const message = data.message ?? "Student attended successfully";
            const result = data.data ?? null;
            const chooseHwDone =
              result?.isChooseHomeworkDone ??
              result?.compareChooseHomeworkScore != null;
            const sourceTitle =
              result?.compareChooseHomeworkLectureTitle ?? "Source Choose HW";

            setLastAttend(result);
            setStatus("success");
            setFeedback(message);
            playScanSuccessVoice("Barcode scanned successfully");
            toast({
              title: "Attended",
              description: `${message} · ${sourceTitle}: ${
                chooseHwDone ? "Done" : "Missing"
              }`,
            });
            qc.invalidateQueries({
              queryKey: getGetLectureStudentsQueryKey(courseId, lectureId),
            });
            qc.invalidateQueries({
              queryKey: getGetLectureStatisticsQueryKey(
                getLectureStatisticsParams(lectureId, centerId) as any
              ),
            });
            resumeScanning(1600);
          },
          onError: () => {
            setStatus("error");
            setFeedback(`Could not attend student: ${code}`);
            toast({
              title: "Scan failed",
              description: "Student not found or already processed.",
              variant: "destructive",
            });
            resumeScanning(2000);
          },
        }
      );
    },
    [
      attendLecture,
      centerId,
      compareChooseHomeworkLectureId,
      courseId,
      lectureId,
      qc,
      resumeScanning,
    ]
  );

  const { scannerRef, cameraStatus, cameraError, retryCamera } =
    useBarcodeScanner(handleScan);

  const chooseHwDone =
    lastAttend?.isChooseHomeworkDone ??
    lastAttend?.compareChooseHomeworkScore != null;
  const sourceTitle =
    lastAttend?.compareChooseHomeworkLectureTitle ?? "Source Choose HW";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-black/90 px-3 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">Center Attendance Scanner</p>
          <p className="truncate text-xs text-white/60">
            {centerName} · Scan → attend → scan next
          </p>
        </div>
        <ScanLine className="h-5 w-5 shrink-0 text-color2" />
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scannerRef}
          className="absolute inset-0 overflow-hidden [&_canvas]:hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-28 w-[min(80vw,320px)] rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        {cameraStatus === "error" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
            <XCircle className="h-8 w-8 text-red-400" />
            <p className="max-w-sm text-sm text-red-200">{cameraError}</p>
            <Button
              type="button"
              onClick={() => void retryCamera()}
              className="bg-gradient-to-r from-color1 to-color2 text-white"
            >
              Allow camera
            </Button>
          </div>
        )}
      </div>

      <footer className="shrink-0 space-y-3 border-t border-white/10 bg-black/90 p-4">
        <div className="flex min-h-[2.5rem] items-center justify-center gap-2 text-sm">
          {cameraStatus === "starting" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting camera...
            </>
          )}
          {cameraStatus === "error" && (
            <>
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{cameraError}</span>
            </>
          )}
          {cameraStatus === "ready" && status === "processing" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {feedback}
            </>
          )}
          {cameraStatus === "ready" && status === "success" && (
            <>
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-400">{feedback}</span>
            </>
          )}
          {cameraStatus === "ready" && status === "error" && (
            <>
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{feedback}</span>
            </>
          )}
          {cameraStatus === "ready" &&
            (status === "scanning" || status === "initializing") && (
              <span className="text-white/70">
                {feedback || "Point camera at student barcode"}
              </span>
            )}
        </div>

        {lastAttend && (
          <div
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-center ${
              chooseHwDone
                ? "border-emerald-400/40 bg-emerald-500/15"
                : "border-red-400/40 bg-red-500/15"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-white/60">
              Source Choose HW
              {sourceTitle ? ` · ${sourceTitle}` : ""}
            </p>
            <p
              className={`text-lg font-bold ${
                chooseHwDone ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {chooseHwDone ? "Done" : "Missing"}
              {chooseHwDone && lastAttend.compareChooseHomeworkScore != null
                ? ` (${lastAttend.compareChooseHomeworkScore})`
                : ""}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={goBack}
        >
          Back to Students List
        </Button>
      </footer>
    </div>
  );
};

export default LectureBarcodeScannerPage;
