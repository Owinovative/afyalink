import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Sign In | Afyalink",
  description: "Secure workspace access.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
