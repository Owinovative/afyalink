import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new Afyalink password using a reset token.",
};

export default function Page() {
  return <AuthForm mode="reset" />;
}
