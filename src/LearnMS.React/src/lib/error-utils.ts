import { ApiError } from "@/lib/axiosCustomInstant";

export function isInsufficientBalanceError(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof ApiError) {
    const code = error.code?.toLowerCase() || "";
    const message = error.message?.toLowerCase() || "";

    const insufficientBalanceCodes = [
      "insufficient_balance",
      "insufficient_credit",
      "insufficient_funds",
      "not_enough_balance",
      "not_enough_credit",
      "not_enough_funds",
      "low_balance",
      "low_credit",
    ];

    if (
      insufficientBalanceCodes.some((errorCode) => code.includes(errorCode))
    ) {
      return true;
    }

    const insufficientBalancePatterns = [
      "insufficient balance",
      "insufficient credit",
      "insufficient funds",
      "not enough balance",
      "not enough credit",
      "not enough funds",
      "low balance",
      "low credit",
      "balance is too low",
      "credit is too low",
      "funds are insufficient",
      "cannot afford",
      "balance insufficient",
      "credit insufficient",
    ];

    if (
      insufficientBalancePatterns.some((pattern) => message.includes(pattern))
    ) {
      return true;
    }
  }

  // Check for error object with message property
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message.toLowerCase();
    const insufficientBalancePatterns = [
      "insufficient balance",
      "insufficient credit",
      "insufficient funds",
      "not enough balance",
      "not enough credit",
      "not enough funds",
      "low balance",
      "low credit",
      "balance is too low",
      "credit is too low",
      "funds are insufficient",
      "cannot afford",
      "balance insufficient",
      "credit insufficient",
    ];

    if (
      insufficientBalancePatterns.some((pattern) => message.includes(pattern))
    ) {
      return true;
    }
  }

  return false;
}
