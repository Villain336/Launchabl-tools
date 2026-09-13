/**
 * Who we Build and Run for (§36–§37).
 * Home-services keep the DoorDash board. Clinics get booking only.
 * Open-demand is frequent Nextdoor/Facebook ask with no established
 * consumer app and no category-default OS. Do not add those slugs to
 * TRADES until a real org is published.
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
    pitch: "People ask on Nextdoor. There is no DoorDash and no Jobber they already live in. We build the front door.",
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

/** Slugs we sell as Build/Run but must not mint empty city×trade pages (§37.5). */
export const UNLISTED_AGENCY_VERTICALS = [
  "appliance-repair",
  "mobile-detailing",
  "gutter-cleaning",
  "window-cleaning",
  "kitchen-hood",
  "small-engine",
  "generator",
  "dentist",
  "medspa",
  "vet",
] as const;
