import { describeCameraError, startBarcodeScanner } from "@/lib/barcode-scanner";
import { useCallback, useEffect, useRef, useState } from "react";

export function useBarcodeScanner(onDetected: (code: string) => void) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const onDetectedRef = useRef(onDetected);
  const stopRef = useRef<(() => void) | null>(null);
  const generationRef = useRef(0);

  onDetectedRef.current = onDetected;

  const [cameraStatus, setCameraStatus] = useState<"starting" | "ready" | "error">(
    "starting"
  );
  const [cameraError, setCameraError] = useState("");

  const startCamera = useCallback(async () => {
    const target = scannerRef.current;
    if (!target) return;

    const generation = ++generationRef.current;
    stopRef.current?.();
    stopRef.current = null;
    setCameraStatus("starting");
    setCameraError("");

    try {
      const stop = await startBarcodeScanner(target, (code) => {
        onDetectedRef.current(code);
      });
      if (generation !== generationRef.current) {
        stop();
        return;
      }
      stopRef.current = stop;
      setCameraStatus("ready");
    } catch (err) {
      if (generation !== generationRef.current) return;
      setCameraStatus("error");
      setCameraError(describeCameraError(err));
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => {
      generationRef.current += 1;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [startCamera]);

  return {
    scannerRef,
    cameraStatus,
    cameraError,
    retryCamera: startCamera,
  };
}
