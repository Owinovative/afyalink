import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your Afyalink email address.",
};

export default function Page() {
  return <AuthForm mode="verify-email" />;
}
