import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Facility Registration",
  description: "Create an Afyalink facility account.",
};

export default function Page() {
  return <AuthForm mode="facility-register" />;
}
