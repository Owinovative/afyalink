import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Verification",
  description: "Credential review, regulatory verification cases, interview scoring, and qualification outcomes.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages.verification} />;
}
