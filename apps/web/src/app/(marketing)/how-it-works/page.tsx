import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How Afyalink guides professional verification, admin review, facility access, and recommendation workflows.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages["how-it-works"]} />;
}
