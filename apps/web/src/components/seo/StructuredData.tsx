import { breadcrumbJsonLd, siteJsonLd } from "@/lib/seo";

type JsonLdData = Record<string, unknown> | Array<Record<string, unknown>>;

export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function SiteStructuredData() {
  return <JsonLd data={siteJsonLd()} />;
}

export function BreadcrumbStructuredData({ path, name }: { path: string; name: string }) {
  if (path === "/") {
    return null;
  }

  return <JsonLd data={breadcrumbJsonLd(path, name)} />;
}
