export function isDomConflictError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    name === "NotFoundError" ||
    message.includes("removeChild") ||
    message.includes("insertBefore") ||
    message.includes("not a child of this node")
  );
}
