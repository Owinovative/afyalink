import type { Metadata } from "next";
import { HomeExperience } from "@/components/marketing/HomeExperience";
import { metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/");

export default function HomePage() {
  return <HomeExperience />;
}
