import type { Metadata } from "next";
import { publicContact } from "@/lib/contact";

export const defaultSiteUrl = "https://www.afyalinks.org";
export const defaultOgImagePath = "/images/hero/healthcare-professional-reviewing-records.jpg";

export type PublicSeoRoute = {
  path: string;
  title: string;
  fullTitle: string;
  description: string;
  priority: number;
};

export const publicSeoRoutes: PublicSeoRoute[] = [
  {
    path: "/",
    title: "Afyalink | Verified Healthcare Talent",
    fullTitle: "Afyalink | Verified Healthcare Talent",
    description:
      "Afyalink helps healthcare professionals, students, and facilities move from verification to trusted placement.",
    priority: 1,
  },
  {
    path: "/professionals",
    title: "Professionals",
    fullTitle: "Professionals | Afyalink",
    description: "Apply, verify credentials, complete interviews, and become placement-ready with Afyalink.",
    priority: 0.9,
  },
  {
    path: "/students",
    title: "Students Awaiting License",
    fullTitle: "Students Awaiting License | Afyalink",
    description: "Start your Afyalink profile before your healthcare license is issued.",
    priority: 0.85,
  },
  {
    path: "/facilities",
    title: "Facilities",
    fullTitle: "Facilities | Afyalink",
    description: "Request verified healthcare candidates, reviewed shortlists, and placement support.",
    priority: 0.9,
  },
  {
    path: "/matching",
    title: "Matching",
    fullTitle: "Matching | Afyalink",
    description: "Afyalink reviews candidate fit before sharing shortlists with facilities.",
    priority: 0.85,
  },
  {
    path: "/how-it-works",
    title: "How It Works",
    fullTitle: "How It Works | Afyalink",
    description: "See how Afyalink moves healthcare talent from application to verified placement.",
    priority: 0.8,
  },
  {
    path: "/verification",
    title: "Verification",
    fullTitle: "Verification | Afyalink",
    description: "Afyalink reviews credentials, regulatory signals, and interviews before publication.",
    priority: 0.8,
  },
  {
    path: "/trust-security",
    title: "Trust & Security",
    fullTitle: "Trust & Security | Afyalink",
    description: "See how Afyalink protects private records, gates access, and audits candidate viewing.",
    priority: 0.8,
  },
  {
    path: "/pricing-access",
    title: "Pricing & Access",
    fullTitle: "Pricing & Access | Afyalink",
    description: "Learn how approved facilities access Afyalink candidate workflows and placement support.",
    priority: 0.7,
  },
  {
    path: "/about",
    title: "About",
    fullTitle: "About | Afyalink",
    description: "Afyalink is a healthcare trust layer for verified talent and controlled facility access.",
    priority: 0.7,
  },
  {
    path: "/contact",
    title: "Contact",
    fullTitle: "Contact | Afyalink",
    description: "Contact Afyalink for facility access, professional support, partnerships, and security questions.",
    priority: 0.7,
  },
  {
    path: "/faq",
    title: "FAQ",
    fullTitle: "FAQ | Afyalink",
    description: "Short answers for healthcare professionals, students, facilities, and security teams using Afyalink.",
    priority: 0.6,
  },
];

export function getSiteUrl(): string {
  return normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl);
}

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function metadataForPath(path: string): Metadata {
  const route = publicSeoRoutes.find((item) => item.path === path);

  if (!route) {
    throw new Error(`Missing SEO route metadata for ${path}`);
  }

  const imageUrl = absoluteUrl(defaultOgImagePath);

  return {
    title: route.path === "/" ? { absolute: route.fullTitle } : route.title,
    description: route.description,
    alternates: {
      canonical: absoluteUrl(route.path),
    },
    openGraph: {
      title: route.fullTitle,
      description: route.description,
      url: absoluteUrl(route.path),
      siteName: "Afyalink",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Healthcare professionals reviewing records with Afyalink.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: route.fullTitle,
      description: route.description,
      images: [imageUrl],
    },
  };
}

export function siteJsonLd() {
  const siteUrl = getSiteUrl();
  const contactPoint = [
    publicContact.email
      ? {
          "@type": "ContactPoint",
          email: publicContact.email,
          telephone: publicContact.phone,
          contactType: "public contact",
        }
      : null,
    publicContact.supportEmail
      ? {
          "@type": "ContactPoint",
          email: publicContact.supportEmail,
          telephone: publicContact.phone,
          contactType: "customer support",
        }
      : null,
  ].filter(Boolean);
  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Afyalink",
    url: siteUrl,
    logo: absoluteUrl("/brand/afyalink-logo.png"),
    telephone: publicContact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: publicContact.location,
      addressCountry: "KE",
    },
    ...(publicContact.email ? { email: publicContact.email } : {}),
    ...(contactPoint.length > 0 ? { contactPoint } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Afyalink",
        url: siteUrl,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Afyalink",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name,
        item: absoluteUrl(path),
      },
    ],
  };
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "") || defaultSiteUrl;
}
