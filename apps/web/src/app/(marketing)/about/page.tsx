import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "About",
  description: "Afyalink as healthcare trust infrastructure for verified professional placement.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages.about} />;
}
