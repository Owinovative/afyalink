import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions for Afyalink professionals, facilities, and operations teams.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages.faq} />;
}
