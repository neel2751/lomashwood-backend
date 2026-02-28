import type { Metadata } from "next";

export const siteConfig = {
  name: "Lomash Wood Admin",
  shortName: "LW Admin",
  description:
    "Administration console for Lomash Wood — kitchen & bedroom design, sales, and consultation services.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://admin.lomashwood.com",
  company: {
    name: "Lomash Wood",
    website: "https://lomashwood.com",
    email: "admin@lomashwood.com",
    phone: "+44 20 0000 0000",
    address: "Lomash Wood, United Kingdom",
  },
  branding: {
    logo: "/logo.svg",
    logoDark: "/logo-dark.svg",
    favicon: "/favicon.ico",
    primaryColor: "#1C1917",
    accentColor: "#B5935A",
  },
  socials: {
    instagram: "https://instagram.com/lomashwood",
    facebook: "https://facebook.com/lomashwood",
    twitter: "https://twitter.com/lomashwood",
  },
  support: {
    email: "support@lomashwood.com",
    docsUrl: "/docs",
  },
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
  environment: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "staging"
    | "production",
} as const;

export const defaultMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: siteConfig.branding.favicon,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export function isProduction(): boolean {
  return siteConfig.environment === "production";
}

export function isDevelopment(): boolean {
  return siteConfig.environment === "development";
}