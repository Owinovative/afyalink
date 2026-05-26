export const contactAddresses = {
  public: process.env.PUBLIC_CONTACT_EMAIL?.trim() || "info@afyalinks.org",
  support: process.env.SUPPORT_EMAIL?.trim() || "support@afyalinks.org",
} as const;
