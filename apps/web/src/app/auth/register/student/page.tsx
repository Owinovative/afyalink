import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Student Registration",
  description: "Create an Afyalink waiting-license account for students and recent healthcare graduates.",
};

export default function Page() {
  return <AuthForm mode="student-register" />;
}

