import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Trust & Security",
  description: "Afyalink private credential storage, permissioned viewing, watermarking, and audit model.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages["trust-security"]} />;
}
