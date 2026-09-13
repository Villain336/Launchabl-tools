import type { Trade } from "@/lib/service-business/profile";
import { defaultStorefront, type Storefront } from "@/lib/service-business/storefront";

/**
 * The directory starts with three businesses the founder already knows.
 * Atlas Lot Care is the one named, real, already-shipped client. The other
 * two are founding-partner slots — honest labels, no invented reviews —
 * that the in-platform storefront editor customizes the same way as any
 * other listing (Shopify-style). Replace the display names in the editor
 * when the remaining two legal names are ready; the slugs stay stable.
 */
export type FoundingListing = {
  slug: string;
  name: string;
  trades: Trade[];
  cities: string[];
  phone: string;
  address: string;
  licensed: boolean;
  insured: boolean;
  bonded: boolean;
  websiteUrl: string | null;
  gbpUrl: string | null;
  placeholder: boolean;
  storefront: Storefront;
};

export const FOUNDING_LISTINGS: FoundingListing[] = [
  {
    slug: "atlas-lot-care",
    name: "Atlas Lot Care",
    trades: ["parking-lot"],
    cities: ["greensboro", "winston-salem", "high-point"],
    phone: "",
    address: "Greensboro, NC",
    licensed: true,
    insured: true,
    bonded: false,
    websiteUrl: "https://atlaslotcare.com/",
    gbpUrl: null,
    placeholder: false,
    storefront: defaultStorefront({
      theme: "bold",
      accent: "#1d4ed8",
      tagline: "Striping, sealcoating, ADA markings, and lot maintenance across the Triad.",
      about:
        "Atlas Lot Care is a Greensboro parking-lot company built to sell the work clearly: striping, sealcoating, ADA markings, and ongoing lot maintenance. One URL instead of a PDF — a local service story and a path to a quote.",
      hours: "Monday–Friday, 7am–5pm · Saturday by appointment",
      yearsInBusiness: "",
      ctaLabel: "Request a lot quote",
      services: [
        { name: "Parking lot striping", description: "Fresh lines, stalls, and directional markings that still look clean after a season of weather.", priceFrom: "" },
        { name: "Sealcoating", description: "Protect the asphalt and stretch the life of the lot before cracks become a tear-out.", priceFrom: "" },
        { name: "ADA markings", description: "Accessible stalls, ramps, and signage done to spec — not a guess from last year's layout.", priceFrom: "" },
        { name: "Lot maintenance", description: "The ongoing work that keeps a commercial lot from looking abandoned between big jobs.", priceFrom: "" },
      ],
      published: true,
    }),
  },
  {
    slug: "founding-lawn-greensboro",
    name: "Founding lawn-care partner",
    trades: ["lawn-care"],
    cities: ["greensboro"],
    phone: "",
    address: "Greensboro, NC",
    licensed: false,
    insured: false,
    bonded: false,
    websiteUrl: null,
    gbpUrl: null,
    placeholder: true,
    storefront: defaultStorefront({
      theme: "workshop",
      accent: "#3f6212",
      tagline: "Lawn care and landscaping in Greensboro — founding partner listing.",
      about:
        "This is one of the three founding NC listings on Launchabl. Customize the name, photos, services, and colors in the OS storefront editor — same control as a Shopify theme, for a local service business.",
      hours: "Monday–Friday, 8am–5pm",
      ctaLabel: "Request lawn care",
      services: [
        { name: "Mowing & edging", description: "Weekly or biweekly cuts that look finished, not rushed.", priceFrom: "" },
        { name: "Cleanup & mulch", description: "Seasonal beds, leaf cleanup, and curb appeal before a listing or an event.", priceFrom: "" },
      ],
      published: true,
    }),
  },
  {
    slug: "founding-hvac-raleigh",
    name: "Founding HVAC partner",
    trades: ["hvac"],
    cities: ["raleigh"],
    phone: "",
    address: "Raleigh, NC",
    licensed: false,
    insured: false,
    bonded: false,
    websiteUrl: null,
    gbpUrl: null,
    placeholder: true,
    storefront: defaultStorefront({
      theme: "classic",
      accent: "#b45309",
      tagline: "Heating and cooling in the Triangle — founding partner listing.",
      about:
        "This is one of the three founding NC listings on Launchabl. Rename it, pick a theme, and publish the real brand in the storefront editor. Until then, homeowners can still send a quote request.",
      hours: "Monday–Friday, 8am–6pm · Emergency by phone",
      ctaLabel: "Request HVAC service",
      services: [
        { name: "Repair & diagnostics", description: "Same-week visits for systems that quit at the worst time.", priceFrom: "" },
        { name: "Maintenance plans", description: "Seasonal tune-ups so the next breakdown is less of a surprise.", priceFrom: "" },
      ],
      published: true,
    }),
  },
];

export function getFoundingListing(slug: string): FoundingListing | null {
  return FOUNDING_LISTINGS.find((listing) => listing.slug === slug) ?? null;
}
