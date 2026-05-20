import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to the Afyalink professional, facility, or admin portal.",
};

export default function Page() {
  return <AuthForm mode="login" />;
}
