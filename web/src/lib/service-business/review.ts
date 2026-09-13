/**
 * Homeowner reviews. A review cannot exist without a completed job — this
 * is the product law that keeps the directory from becoming Angi-style
 * star theater (§27). Stars are never invented; empty is honest.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { getCustomer } from "./customer";
import { getJobByReviewToken } from "./job";
import { getServiceBusinessProfile } from "./profile";
import { cleanText, newId, RECORD_TTL, type DomainError } from "./shared";

export type CustomerReview = {
  id: string;
  orgId: string;
  jobId: string;
  listingSlug: string;
  rating: number;
  body: string;
  authorName: string;
  createdAt: string;
};

export type ListingProof = {
  completedJobs: number;
  reviews: CustomerReview[];
};

export const EMPTY_PROOF: ListingProof = { completedJobs: 0, reviews: [] };

const reviewKey = (id: string) => `review:${id}`;
const listingReviewIndex = (slug: string) => `review:listing:${slug}`;
const jobReviewKey = (jobId: string) => `review:job:${jobId}`;

export function isRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function getReview(id: string, store: KeyValueStore = getStore()): Promise<CustomerReview | null> {
  const raw = await store.get(reviewKey(id));
  return raw ? (JSON.parse(raw) as CustomerReview) : null;
}

export async function listReviewsForListing(slug: string, store: KeyValueStore = getStore()): Promise<CustomerReview[]> {
  const ids = await store.smembers(listingReviewIndex(slug));
  const reviews: CustomerReview[] = [];
  for (const id of ids) {
    const review = await getReview(id, store);
    if (review) reviews.push(review);
    else await store.srem(listingReviewIndex(slug), id);
  }
  return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function submitJobReview(
  input: { token?: string; listingSlug?: string; rating?: number; body?: string; authorName?: string },
  store: KeyValueStore = getStore(),
): Promise<CustomerReview | DomainError> {
  const token = cleanText(input.token, 40);
  if (!token) return { error: "This review link is missing." };
  const job = await getJobByReviewToken(token, store);
  if (!job) return { error: "That review link is not valid. Reviews only open after the job is completed." };
  if (await store.get(jobReviewKey(job.id))) return { error: "A review is already on file for this job." };
  if (!isRating(input.rating)) return { error: "Pick a rating from 1 to 5." };
  const profile = await getServiceBusinessProfile(job.orgId, store);
  const listingSlug = profile?.slug || cleanText(input.listingSlug, 80);
  if (!listingSlug) return { error: "This contractor does not have a public listing yet." };
  const customer = await getCustomer(job.orgId, job.customerId, store);
  const review: CustomerReview = {
    id: newId("rev"),
    orgId: job.orgId,
    jobId: job.id,
    listingSlug,
    rating: input.rating,
    body: cleanText(input.body, 2000),
    authorName: cleanText(input.authorName, 80) || customer?.name || "Customer",
    createdAt: new Date().toISOString(),
  };
  await store.set(reviewKey(review.id), JSON.stringify(review), RECORD_TTL);
  await store.set(jobReviewKey(job.id), review.id, RECORD_TTL);
  if (listingSlug) await store.sadd(listingReviewIndex(listingSlug), review.id, RECORD_TTL);
  await logAuditEvent({ orgId: job.orgId, actorUid: "homeowner", action: "review.created", target: review.id, detail: { jobId: job.id, rating: review.rating } }, store);
  return review;
}
