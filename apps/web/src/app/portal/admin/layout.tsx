import { PortalLayout } from "@/components/layout/PortalLayout";
import { adminLinks } from "@/lib/routes";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout role="admin" title="Admin Portal" links={adminLinks}>
      {children}
    </PortalLayout>
  );
}
