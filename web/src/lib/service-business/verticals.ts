/**
 * Who we Build and Run for (§36). Home-services keep the DoorDash board.
 * Clinics get a booking / recall front door — not first-come dispatch,
 * and not a clinical record. We do not claim HIPAA/PMS replacement.
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
    id: "local-care",
    label: "Local care",
    shape: "booking",
    examples: ["Medspa", "Dentist", "Vet"],
    pitch: "Booking, reviews, and local demand. Clinical charts stay in their software.",
  },
] as const;

export type AgencyVerticalGroup = (typeof AGENCY_VERTICAL_GROUPS)[number];
