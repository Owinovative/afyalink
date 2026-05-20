import { MarketingNav } from "@/components/layout/MarketingNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <MarketingNav />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
