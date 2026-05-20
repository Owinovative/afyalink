import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Professionals",
  description: "Professional registration, credential upload, consent, payment reference, verification, interview, and publication visibility.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages.professionals} />;
}
