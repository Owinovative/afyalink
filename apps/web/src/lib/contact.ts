const defaultSiteUrl = "https://www.afyalinks.org";
const defaultPhone = "+254711776391";
const defaultLocation = "Hardy, Karen";

function optionalEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl;

  return configured.replace(/\/+$/, "");
}

function websiteLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "www.afyalinks.org";
  }
}

function displayPhone(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  if (digits === "254711776391") {
    return "+254 711 776 391";
  }

  return phone;
}

function phoneHref(phone: string): string {
  const digits = phone.replace(/\D+/g, "");

  return digits === "" ? "" : `tel:+${digits}`;
}

const phone = process.env.PUBLIC_CONTACT_PHONE?.trim() || defaultPhone;
const url = siteUrl();

export const publicContact = {
  email: optionalEnv(process.env.PUBLIC_CONTACT_EMAIL),
  supportEmail: optionalEnv(process.env.SUPPORT_EMAIL),
  adminEmail: optionalEnv(process.env.ADMIN_EMAIL),
  phone: displayPhone(phone),
  phoneHref: phoneHref(phone),
  location: process.env.PUBLIC_LOCATION?.trim() || defaultLocation,
  siteUrl: url,
  website: websiteLabel(url),
} as const;

export const contactAddresses = {
  public: publicContact.email,
  support: publicContact.supportEmail,
} as const;
