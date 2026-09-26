export type LectureDiscountTarget = "Lecture" | "Renewal" | "Both";

type LectureDiscountTagProps = {
  percentage?: number | null;
  appliesTo?: LectureDiscountTarget | string | null;
  enrollment?: string | null;
};

export function lectureDiscountApplies(
  appliesTo: LectureDiscountTarget | string | null | undefined,
  enrollment: string | null | undefined
) {
  if (!appliesTo) return false;
  const isRenewal = enrollment === "Expired";
  return (
    appliesTo === "Both" ||
    (isRenewal ? appliesTo === "Renewal" : appliesTo === "Lecture")
  );
}

export function LectureDiscountTag({
  percentage,
  appliesTo,
  enrollment,
}: LectureDiscountTagProps) {
  if (percentage == null || percentage <= 0) return null;
  if (!lectureDiscountApplies(appliesTo, enrollment)) return null;

  const label = Number.isInteger(percentage)
    ? String(percentage)
    : String(percentage);

  return (
    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      {label}% off
    </span>
  );
}
