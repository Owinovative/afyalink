# Search Engine Indexing

Afyalink exposes search engine metadata only for public marketing pages on:

```text
https://www.afyalinks.org
```

The generated sitemap is:

```text
https://www.afyalinks.org/sitemap.xml
```

Only these public routes should be submitted for indexing:

```text
/
/professionals
/students
/facilities
/matching
/how-it-works
/verification
/trust-security
/pricing-access
/about
/contact
/faq
```

Private workspaces and auth pages are blocked in `robots.txt` and also set page metadata with `noindex, nofollow`:

```text
/portal/
/auth/
/api/
```

## Required Environment

Set these on the Render frontend service:

```env
NEXT_PUBLIC_SITE_URL=https://www.afyalinks.org
NEXT_PUBLIC_AFYA_API_BASE=https://api.afyalinks.org
```

Set these on the Render backend service:

```env
APP_URL=https://www.afyalinks.org
API_URL=https://api.afyalinks.org
CORS_ALLOWED_ORIGINS=https://www.afyalinks.org
```

## Google Search Console

1. Open Google Search Console.
2. Add a Domain property for `afyalinks.org`.
3. Copy the DNS TXT verification record.
4. Add the TXT record in Cloudflare DNS.
5. Wait for Google Search Console verification.
6. Submit `https://www.afyalinks.org/sitemap.xml`.
7. Verify the sitemap is accessible in a browser.
8. Test `https://www.afyalinks.org/robots.txt`.
9. Search Google using:

```text
site:afyalinks.org
```

## Bing Webmaster Tools

1. Add `afyalinks.org` in Bing Webmaster Tools.
2. Verify ownership with DNS TXT in Cloudflare, or import the verified Google Search Console property.
3. Submit the same sitemap:

```text
https://www.afyalinks.org/sitemap.xml
```

4. Test robots rules in Bing Webmaster Tools.

## Launch Checks

After deployment:

```bash
curl https://www.afyalinks.org/sitemap.xml
curl https://www.afyalinks.org/robots.txt
```

Confirm:

- sitemap includes only public marketing routes;
- sitemap does not include `/portal`, `/auth`, `/api`, admin, facility, professional, or candidate detail routes;
- robots allows `/`;
- robots disallows `/portal/`, `/auth/`, and `/api/`;
- page source for `/auth/login` contains `noindex`;
- page source for `/portal/professional/dashboard` contains `noindex`.

Indexing is not instant. Google and Bing decide when to crawl, whether to index, and how pages rank. Sitemap submission improves discovery but does not guarantee ranking.
