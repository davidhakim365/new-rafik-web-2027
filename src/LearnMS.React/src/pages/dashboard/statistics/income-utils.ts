export const OFFLINE_CENTER_FEE_RATE = 0.25;

export function calculateOfflineIncome(
  studentCount: number,
  lecturePrice: number
): number {
  return studentCount * lecturePrice * (1 - OFFLINE_CENTER_FEE_RATE);
}

export function calculateOnlineIncome(
  studentCount: number,
  lecturePrice: number
): number {
  return studentCount * lecturePrice;
}

export function calculateTotalIncome(
  offlineStudents: number,
  onlineStudents: number,
  lecturePrice: number
): number {
  return (
    calculateOfflineIncome(offlineStudents, lecturePrice) +
    calculateOnlineIncome(onlineStudents, lecturePrice)
  );
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} LE`;
}

export function toApiDateString(date?: Date): string | undefined {
  return date?.toISOString();
}
