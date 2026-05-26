import type { Metadata } from "next";
import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";
import { metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/faq");

export default function Page() {
  return <MarketingContentPage page={marketingPages.faq} />;
}
