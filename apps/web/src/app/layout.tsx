import type { Metadata, Viewport } from "next";
import { absoluteUrl, getSiteUrl, metadataForPath } from "@/lib/seo";
import "./globals.css";

const homeMetadata = metadataForPath("/");

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "Afyalink",
  title: {
    default: "Afyalink | Verified Healthcare Talent",
    template: "%s | Afyalink",
  },
  description: homeMetadata.description,
  openGraph: homeMetadata.openGraph,
  twitter: homeMetadata.twitter,
  icons: {
    icon: absoluteUrl("/brand/afyalink-logo.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2f35",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
