import { display } from "@/lib/formatters";

export function Badge({ value }: { value: unknown }) {
  const text = display(value);
  const normalized = text.toLowerCase();
  const tone = normalized.includes("active") || normalized.includes("approved") || normalized.includes("published")
    ? "green"
    : normalized.includes("reject") || normalized.includes("suspend") || normalized.includes("expired")
      ? "red"
      : normalized.includes("pending") || normalized.includes("review") || normalized.includes("draft")
        ? "gold"
        : "";

  return <span className={`badge ${tone}`}>{text}</span>;
}
