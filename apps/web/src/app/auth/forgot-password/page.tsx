import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request an Afyalink password reset.",
};

export default function Page() {
  return <AuthForm mode="forgot" />;
}
