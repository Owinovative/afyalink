import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Pricing & Access",
  description: "Facility subscription and active access requirements for the Afyalink candidate marketplace.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages["pricing-access"]} />;
}
