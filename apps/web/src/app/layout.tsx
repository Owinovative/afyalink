import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://afyalink.health"),
  title: {
    default: "Afyalink | Healthcare verification and placement infrastructure",
    template: "%s | Afyalink",
  },
  description:
    "Afyalink verifies healthcare professionals, protects credential data, and gives approved facilities controlled access to trusted candidate profiles.",
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
