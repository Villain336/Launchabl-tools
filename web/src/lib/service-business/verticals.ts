/**
 * Who we Build and Run for (§36–§37).
 * Home-services keep the DoorDash board. Clinics get booking only.
 * Open-demand is frequent Nextdoor/Facebook ask with no established
 * consumer app and no category-default OS. The first three are in
 * TRADES (§37.5). Hoods, small engines, and generators stay agency-only.
 */
export const AGENCY_VERTICAL_GROUPS = [
  {
    id: "home-services",
    label: "Home services",
    shape: "dispatch",
    examples: ["Lawn", "Cleaning", "HVAC", "Pest"],
    pitch: "Ping the trade. First crew claims. We build the page and run the book.",
  },
  {
    id: "open-demand",
    label: "No-platform demand",
    shape: "agency-first",
    examples: ["Appliance repair", "Mobile detailing", "Gutters & windows", "Kitchen hoods", "Small engines"],
    pitch: "People ask on Nextdoor. Appliance, detailing, and gutters are on the board. Hoods and small engines stay agency-first.",
  },
  {
    id: "local-care",
    label: "Local care",
    shape: "booking",
    examples: ["Medspa", "Dentist", "Vet"],
    pitch: "Booking, reviews, and local demand. Clinical charts stay in their software.",
  },
] as const;

export type AgencyVerticalGroup = (typeof AGENCY_VERTICAL_GROUPS)[number];

/** First three no-platform asks — now public trades (§37.5). */
export const LISTED_OPEN_DEMAND_TRADES = ["appliance-repair", "mobile-detailing", "gutter-cleaning"] as const;

/** Still agency-only. Empty city pages stay a lie. */
export const UNLISTED_AGENCY_VERTICALS = [
  "window-cleaning",
  "kitchen-hood",
  "small-engine",
  "generator",
  "dentist",
  "medspa",
  "vet",
] as const;
