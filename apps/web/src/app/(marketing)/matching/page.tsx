import { MarketingContentPage } from "@/components/marketing/MarketingContentPage";
import { marketingPages } from "@/lib/content/marketing";

export default function Page() {
  return <MarketingContentPage page={marketingPages.matching} />;
}
