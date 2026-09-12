import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** Admin routes are gated by a single shared token (`ADMIN_TOKEN`), sent as a Bearer header. */
export function adminAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : request.headers.get("x-admin-token") ?? "";
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
