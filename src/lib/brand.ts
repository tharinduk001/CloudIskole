/**
 * Single source of truth for brand-facing strings.
 *
 * Every user-visible mention of the product — page titles, emails, SMS
 * templates, legal pages, OG tags — reads from here, so a rename or a change
 * of contact details is one edit rather than a search-and-replace.
 */
export const brand = {
  name: "CloudIskole",
  tagline: "Sri Lanka's launchpad into Cloud & DevOps careers",
  description:
    "Practical, affordable Cloud, DevOps and Software Engineering courses built for Sri Lankan students after A/Ls. Learn the skills employers actually hire for.",

  legalEntity: "CloudIskole",
  country: "Sri Lanka",
  locale: "en_LK",
  timezone: "Asia/Colombo",
  currency: "LKR",

  contact: {
    email: "hello@cloudiskole.lk",
    supportEmail: "support@cloudiskole.lk",
    // E.164 format, no spaces (used to build the wa.me link directly).
    whatsapp: "+94784975753",
  },

  social: {
    facebook: "",
    linkedin: "",
    youtube: "",
    instagram: "",
    tiktok: "",
  },
} as const;
