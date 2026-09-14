/**
 * Official agency operating model (§38).
 * Build stands the business up in 14 days. Network is included for 90 days,
 * then $99. Run is $497 and includes Network. We only sell Run where we
 * will actually sit on that city×trade's "anyone know a guy?" posts.
 * Atlas Lot Care is the only named proof. We do not scrape Nextdoor.
 */
import { AGENCY_PACKAGES, LEAD_TIERS } from "@/lib/marketplace/pricing";
import { UNLISTED_AGENCY_VERTICALS } from "./verticals";

export const AGENCY_MODEL = {
  buildUsd: AGENCY_PACKAGES.launch.price,
  networkUsd: LEAD_TIERS.network.priceMonthly,
  runUsd: AGENCY_PACKAGES["managed-growth"].price,
  buildSlaDays: 14,
  buildIncludesNetworkDays: 90,
  foundingCrewsToOpenBoard: 3,
  guarantee: "Live booking page, OS job book, and Network profile in 14 days, or Build is refunded.",
  proof: {
    name: "Atlas Lot Care",
    url: "https://atlaslotcare.com",
    href: "/case-studies/atlas-lot-care",
    city: "Greensboro",
    note: "The only named real client. Parking-lot work is a case study, not liquidity proof.",
  },
} as const;

/** Winter / remaining-season hunt. Appliance sits with cleaning so January still has a board. */
export const WINTER_HUNT = ["cleaning", "appliance-repair", "hvac", "pest-control", "lawn-care"] as const;

export const BUILD_SEQUENCE = [
  {
    day: "1–2",
    title: "Audit and reply kit",
    detail:
      "We read the current site, GBP, and how they already get work. They leave day 2 with Nextdoor, Facebook, and GBP reply scripts that end on their future /b link — before the brand is pretty.",
  },
  {
    day: "3–7",
    title: "Brand, site, booking",
    detail: "Offer, service area, and a live calendar. The page is a booking link, not a brochure they apologize for.",
  },
  {
    day: "8–11",
    title: "OS and Network profile",
    detail: "Job book, customers, estimates, payments. Profile is search-indexed. They can claim if that city×trade already has three seated crews.",
  },
  {
    day: "12–14",
    title: "Live handoff",
    detail: "They send the /b link after a real call. We sit on the first neighborhood asks with them if they bought Run. Build is done when that loop works, not when a Figma file is approved.",
  },
] as const;

export const REPLY_KIT = {
  channels: ["Nextdoor", "Facebook", "Google Business Profile"] as const,
  rule: "We write the replies. We do not scrape Nextdoor or LeadHall.",
  cta: "Every reply ends with the /b booking link.",
  queueHref: "/os/replies",
} as const;

export const AGENCY_WONT = [
  "Scrape Nextdoor or LeadHall. We reply as the operator. We do not sell a fake data product.",
  "Replace Dentrix, ezyVet, Aesthetic Record, or any clinic chart.",
  "Issue NFPA certificates or fire-marshal software for hoods.",
  "Invent crews, reviews, or case studies. Atlas Lot Care is the named proof.",
  "Charge per ping or sell the same lead to three shops.",
  "Sell Run for a city and trade we will not sit on.",
] as const;

export const AGENCY_VS = [
  {
    name: "Jobber / Housecall Pro",
    ours: "They sell the shop a desk. We stand the front door up and, on Run, sit on the neighborhood asks that fill it.",
  },
  {
    name: "A walk-away agency",
    ours: "A logo and a site they cannot update is how local shops get burned. We stay. The Network seat is the product after week two.",
  },
  {
    name: "Angi / Thumbtack",
    ours: "Shared contacts they already hate. We ping a city×trade once. First claim owns it. Or they text their own /b link and skip the blast.",
  },
] as const;

export const AGENCY_INTAKE_OFFERS = ["build", "network", "run", "not-sure"] as const;
export type AgencyIntakeOffer = (typeof AGENCY_INTAKE_OFFERS)[number];

export const AGENCY_INTAKE_VERTICALS = [
  { id: "cleaning", label: "Cleaning" },
  { id: "appliance-repair", label: "Appliance repair" },
  { id: "hvac", label: "HVAC" },
  { id: "pest-control", label: "Pest control" },
  { id: "lawn-care", label: "Lawn care" },
  { id: "mobile-detailing", label: "Mobile detailing" },
  { id: "gutter-cleaning", label: "Gutters, windows & dryer vents" },
  { id: "junk-removal", label: "Junk removal" },
  { id: "courier", label: "Courier / cargo van" },
  { id: "pressure-washing", label: "Pressure washing" },
  { id: "parking-lot", label: "Parking lot & paving" },
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "painting", label: "Painting" },
  { id: "kitchen-hood", label: "Kitchen hood / grease trap" },
  { id: "small-engine", label: "Small-engine / outdoor power" },
  { id: "generator", label: "Standby generator service" },
  { id: "window-cleaning", label: "Window cleaning (standalone)" },
  { id: "medspa", label: "Medspa" },
  { id: "dentist", label: "Dentist" },
  { id: "vet", label: "Vet" },
  { id: "other", label: "Something else" },
] as const;

export type AgencyIntakeVerticalId = (typeof AGENCY_INTAKE_VERTICALS)[number]["id"];

const INTAKE_VERTICAL_IDS = new Set<string>(AGENCY_INTAKE_VERTICALS.map((item) => item.id));

/** Unlisted clinic / hood verticals stay off TRADES; intake still accepts them. */
export function intakeVerticalIsUnlisted(id: string): boolean {
  return (UNLISTED_AGENCY_VERTICALS as readonly string[]).includes(id);
}

export function networkPriceAfterBuild(daysSinceBuild: number): number {
  if (!Number.isFinite(daysSinceBuild) || daysSinceBuild < 0) return AGENCY_MODEL.networkUsd;
  return daysSinceBuild < AGENCY_MODEL.buildIncludesNetworkDays ? 0 : AGENCY_MODEL.networkUsd;
}

export function networkSeatIncludedWithBuild(daysSinceBuild: number): boolean {
  return networkPriceAfterBuild(daysSinceBuild) === 0;
}

/** A city×trade board is not “open” until three claiming crews sit on it. */
export function canOpenCityTradeBoard(claimingCrews: number): boolean {
  return Number.isFinite(claimingCrews) && claimingCrews >= AGENCY_MODEL.foundingCrewsToOpenBoard;
}

export type CityTradeBoard = {
  seated: number;
  needed: number;
  open: boolean;
  seatsToOpen: number;
};

export function cityTradeBoard(claimingCrews: number): CityTradeBoard {
  const seated = Number.isFinite(claimingCrews) ? Math.max(0, Math.floor(claimingCrews)) : 0;
  const needed = AGENCY_MODEL.foundingCrewsToOpenBoard;
  const seatsToOpen = Math.max(0, needed - seated);
  return { seated, needed, open: seatsToOpen === 0, seatsToOpen };
}

export function foundingBoardCopy(cityName: string, tradeLabel: string, board: CityTradeBoard): string {
  if (board.open) {
    return `${board.seated} claiming ${tradeLabel.toLowerCase()} crews sit in ${cityName}. First claim owns the job.`;
  }
  return `${board.seated} of ${board.needed} claiming ${tradeLabel.toLowerCase()} crews sit in ${cityName}. This board is not open. The first three get 90 days of Network with Build. A seated crew that brings the next one gets a month of Network credited.`;
}

/** One month of Network when a seated crew brings founding crew 2 or 3. */
export const FOUNDING_REFERRAL = {
  creditMonths: 1,
  creditUsd: AGENCY_MODEL.networkUsd,
} as const;

/** Run is a promise to sit on neighborhood asks. If we will not, we do not sell it. */
export function willSellRun(weWillSitOnNeighborhoodAsks: boolean): boolean {
  return weWillSitOnNeighborhoodAsks === true;
}

export type AgencyIntakeDraft = {
  name?: unknown;
  businessName?: unknown;
  email?: unknown;
  phone?: unknown;
  city?: unknown;
  vertical?: unknown;
  website?: unknown;
  offer?: unknown;
  notes?: unknown;
};

export type AgencyIntake = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  city: string;
  vertical: AgencyIntakeVerticalId;
  website: string;
  offer: AgencyIntakeOffer;
  notes: string;
};

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function parseAgencyIntake(input: AgencyIntakeDraft): { ok: true; intake: AgencyIntake } | { ok: false; error: string } {
  const name = clean(input.name, 80);
  const businessName = clean(input.businessName, 120);
  const email = clean(input.email, 200).toLowerCase();
  const phone = clean(input.phone, 40);
  const city = clean(input.city, 80);
  const vertical = clean(input.vertical, 40);
  const website = clean(input.website, 200);
  const offer = clean(input.offer, 20);
  const notes = clean(input.notes, 2000);

  if (name.length < 2) return { ok: false, error: "Tell us who to talk to." };
  if (businessName.length < 2) return { ok: false, error: "What is the business called?" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "We need a real email so we can reply." };
  if (city.length < 2) return { ok: false, error: "Which city should we sit in?" };
  if (!INTAKE_VERTICAL_IDS.has(vertical)) return { ok: false, error: "Pick a trade we actually Build." };
  if (!(AGENCY_INTAKE_OFFERS as readonly string[]).includes(offer)) {
    return { ok: false, error: "Pick Build, Network, Run, or not sure yet." };
  }

  return {
    ok: true,
    intake: {
      name,
      businessName,
      email,
      phone,
      city,
      vertical: vertical as AgencyIntakeVerticalId,
      website,
      offer: offer as AgencyIntakeOffer,
      notes,
    },
  };
}

export function formatAgencyIntakeEmail(intake: AgencyIntake): { subject: string; body: string } {
  const vertical = AGENCY_INTAKE_VERTICALS.find((item) => item.id === intake.vertical)?.label ?? intake.vertical;
  return {
    subject: `Agency intake — ${intake.businessName} (${intake.offer})`,
    body: [
      `${intake.name} · ${intake.businessName}`,
      `Email: ${intake.email}`,
      intake.phone ? `Phone: ${intake.phone}` : null,
      `City: ${intake.city}`,
      `Trade: ${vertical}`,
      `Offer: ${intake.offer}`,
      intake.website ? `Website: ${intake.website}` : null,
      intake.notes ? `Notes: ${intake.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
