import type { Metadata } from "next";
import { MatchingExperience } from "@/components/marketing/MatchingExperience";
import { metadataForPath } from "@/lib/seo";

export const metadata: Metadata = metadataForPath("/matching");

export default function Page() {
  return <MatchingExperience />;
}
