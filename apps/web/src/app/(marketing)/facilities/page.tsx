import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Facility onboarding, subscription-gated candidate marketplace access, appointments, and recommendations.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages.facilities} />;
}
