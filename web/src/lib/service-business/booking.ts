/**
 * Public booking against the contractor's real calendar (§28).
 * Homeowners do not adopt a directory. They pick a Saturday. This is the
 * reason to open a storefront — not exclusive-lead copy.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getOrg } from "@/lib/orgs/org";
import { sendOrgAlert } from "./alerts";
import { createCustomer } from "./customer";
import { createJob, findScheduleConflicts, jobWindow, listJobs, windowsOverlap, type Job } from "./job";
import { submitLead, type Lead } from "./lead";
import { getServiceBusinessProfile, isTrade, type Trade } from "./profile";
import { type Storefront } from "./storefront";
import { cleanText, RECORD_TTL, type DomainError } from "./shared";

export type BookableListing = {
  slug: string;
  name: string;
  orgId: string | null;
  trades: Trade[];
  cities: string[];
  storefront: Storefront;
};

export const BOOKING_TZ = "America/New_York";

export type BookingHours = {
  enabled: boolean;
  startHour: number;
  endHour: number;
  slotMinutes: number;
  driveMinutes: number;
};

export type OpenSlot = { start: string; label: string };

export type PublicBooking = {
  lead: Lead;
  jobId: string | null;
};

const slotLockKey = (slug: string, start: string) => `bookslot:${slug}:${start}`;

export function bookingHoursFrom(storefront: Pick<Storefront, "bookingEnabled" | "bookingStartHour" | "bookingEndHour" | "slotMinutes" | "bookingDriveMinutes">): BookingHours {
  const startHour = clampHour(storefront.bookingStartHour, 8);
  const endHour = clampHour(storefront.bookingEndHour, 17);
  return {
    enabled: storefront.bookingEnabled !== false,
    startHour,
    endHour: endHour > startHour ? endHour : startHour + 1,
    slotMinutes: storefront.slotMinutes > 0 ? storefront.slotMinutes : 60,
    driveMinutes: storefront.bookingDriveMinutes >= 0 ? storefront.bookingDriveMinutes : 20,
  };
}

function clampHour(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback;
}

export function wallTimeInZone(year: number, month: number, day: number, hour: number, minute: number, timeZone = BOOKING_TZ): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const asUtc = Date.parse(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00.000Z`);
  const probe = new Date(asUtc);
  const shown = new Date(probe.toLocaleString("en-US", { timeZone }));
  return new Date(asUtc + (asUtc - shown.getTime()));
}

export function formatSlotLabel(iso: string, timeZone = BOOKING_TZ): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function datePartsInZone(date: Date, timeZone = BOOKING_TZ): { year: number; month: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

function addCalendarDays(year: number, month: number, day: number, offset: number): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(year, month - 1, day + offset));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

export function slotBlocksExisting(slotStart: Date, durationMinutes: number, driveMinutes: number, jobs: Job[]): boolean {
  const candidate = jobWindow({ scheduledFor: slotStart.toISOString(), durationMinutes, driveMinutes });
  if (!candidate) return false;
  return jobs.some((job) => {
    if (job.status === "canceled" || job.status === "completed") return false;
    const other = jobWindow(job);
    return Boolean(other && windowsOverlap(candidate, other));
  });
}

export function listOpenSlots(
  hours: BookingHours,
  jobs: Job[],
  now = new Date(),
  dayCount = 10,
): OpenSlot[] {
  if (!hours.enabled) return [];
  const slots: OpenSlot[] = [];
  const origin = datePartsInZone(now);
  let addedDays = 0;
  for (let offset = 0; addedDays < dayCount && offset < 21; offset += 1) {
    const day = addCalendarDays(origin.year, origin.month, origin.day, offset);
    const noon = wallTimeInZone(day.year, day.month, day.day, 12, 0);
    if (datePartsInZone(noon).weekday === 0 || datePartsInZone(noon).weekday === 6) continue;
    addedDays += 1;
    for (let hour = hours.startHour; hour < hours.endHour; hour += 1) {
      const start = wallTimeInZone(day.year, day.month, day.day, hour, 0);
      if (start.getTime() <= now.getTime() + 30 * 60_000) continue;
      if (slotBlocksExisting(start, hours.slotMinutes, hours.driveMinutes, jobs)) continue;
      const iso = start.toISOString();
      slots.push({ start: iso, label: formatSlotLabel(iso) });
    }
  }
  return slots;
}

export function startingPriceFrom(storefront: Pick<Storefront, "services">): string | null {
  for (const service of storefront.services) {
    if (service.priceFrom) return service.priceFrom;
  }
  return null;
}

export async function listOpenSlotsForListing(listing: BookableListing, store: KeyValueStore = getStore(), now = new Date()): Promise<OpenSlot[]> {
  const hours = bookingHoursFrom(listing.storefront);
  const jobs = listing.orgId ? await listJobs(listing.orgId, store) : [];
  return listOpenSlots(hours, jobs, now);
}

export async function bookPublicSlot(
  listing: BookableListing,
  input: {
    listingSlug?: string;
    trade?: Trade | string;
    city?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    serviceName?: string;
    scheduledFor?: string;
    sourcePath?: string;
  },
  store: KeyValueStore = getStore(),
  now = new Date(),
): Promise<PublicBooking | DomainError> {
  if (!listing.storefront.published) return { error: "That listing isn't taking bookings right now." };
  const hours = bookingHoursFrom(listing.storefront);
  if (!hours.enabled) return { error: "This contractor is not taking online bookings. Leave a quote request instead." };
  const scheduledFor = cleanText(input.scheduledFor, 40);
  if (!scheduledFor) return { error: "Pick a time." };
  const slots = await listOpenSlotsForListing(listing, store, now);
  if (!slots.some((slot) => slot.start === scheduledFor)) return { error: "That time is gone. Pick another." };
  const locked = await store.setNx(slotLockKey(listing.slug, scheduledFor), "1", RECORD_TTL);
  if (!locked) return { error: "That time is gone. Pick another." };

  const serviceName = cleanText(input.serviceName, 80);
  const address = cleanText(input.address, 200);
  const trade = input.trade && isTrade(input.trade) ? input.trade : listing.trades[0];
  const city = cleanText(input.city, 80) || listing.cities[0] || "";
  const profile = listing.orgId ? await getServiceBusinessProfile(listing.orgId, store) : null;
  const lead = await submitLead(
    {
      orgId: listing.orgId,
      leadTier: profile?.leadTier,
      listingSlug: listing.slug,
      trade,
      city,
      name: input.name,
      phone: input.phone,
      email: input.email,
      description: serviceName ? `${serviceName}${address ? ` @ ${address}` : ""}` : address,
      urgency: "soon",
      sourcePath: input.sourcePath,
      scheduledFor,
      serviceName,
      address,
      mustDeliver: true,
    },
    store,
  );
  if ("error" in lead) return lead;

  if (!listing.orgId) return { lead, jobId: null };

  const org = await getOrg(listing.orgId, store);
  if (!org) return { lead, jobId: null };
  const customer = await createCustomer(
    listing.orgId,
    org.ownerUid,
    {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      addresses: address ? [address] : [],
      source: "marketplace-lead",
      notes: `Booked ${formatSlotLabel(scheduledFor)}${serviceName ? ` — ${serviceName}` : ""}`,
    },
    store,
  );
  if ("error" in customer) return { lead, jobId: null };

  const conflict = await findScheduleConflicts(
    listing.orgId,
    {
      id: "booking",
      assignedUid: org.ownerUid,
      scheduledFor,
      durationMinutes: hours.slotMinutes,
      driveMinutes: hours.driveMinutes,
      status: "scheduled",
    },
    store,
  );
  if (conflict.length) return { error: "That time is gone. Pick another." };

  const job = await createJob(
    listing.orgId,
    org.ownerUid,
    {
      customerId: customer.id,
      leadId: lead.id,
      title: serviceName || `Booked visit — ${city}`,
      serviceType: trade,
      scheduledFor,
      durationMinutes: hours.slotMinutes,
      driveMinutes: hours.driveMinutes,
      address,
      assignedUid: org.ownerUid,
      notes: lead.description,
    },
    store,
  );
  if ("error" in job) return { error: job.error };

  await sendOrgAlert(listing.orgId, {
    title: `Booked: ${formatSlotLabel(scheduledFor)}`,
    body: `${lead.name} booked ${serviceName || "a visit"} at ${formatSlotLabel(scheduledFor)}. ${lead.phone || lead.email}. It's on the job book — not a quote pile.`,
  }, store);

  return { lead, jobId: job.id };
}
