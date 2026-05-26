import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { SiteStructuredData } from "@/components/seo/StructuredData";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteStructuredData />
      <MarketingLayout>{children}</MarketingLayout>
    </>
  );
}
