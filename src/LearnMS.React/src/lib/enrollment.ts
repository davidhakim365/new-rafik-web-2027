import { Enrollment } from "@/generated/model";

export function resolveEnrollment(
  enrollment?: string | number | null,
  expiresAt?: string | Date | null
): Enrollment {
  if (expiresAt) {
    const expires = new Date(expiresAt).getTime();
    if (!Number.isNaN(expires)) {
      return expires >= Date.now() ? "Active" : "Expired";
    }
  }

  if (enrollment === "Active" || enrollment === 0) return "Active";
  if (enrollment === "Expired" || enrollment === 1) return "Expired";
  return "NotEnrolled";
}
