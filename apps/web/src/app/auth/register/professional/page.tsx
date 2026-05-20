import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Professional Registration",
  description: "Create an Afyalink professional account.",
};

export default function Page() {
  return <AuthForm mode="professional-register" />;
}
