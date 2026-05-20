export function Feedback({ message, tone = "success" }: { message: string; tone?: "success" | "error" | "info" }) {
  return <div className={`notice ${tone === "error" ? "error" : tone === "success" ? "success" : ""}`}>{message}</div>;
}
