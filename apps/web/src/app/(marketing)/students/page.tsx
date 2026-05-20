import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export const metadata: Metadata = {
  title: "Students Awaiting License",
  description: "Pre-licensure Afyalink onboarding for healthcare students and graduates waiting for professional registration.",
};

export default function Page() {
  return <MarketingContentPage page={marketingPages.students} />;
}

