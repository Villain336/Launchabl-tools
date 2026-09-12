import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { deleteReport, isReportId } from "@/lib/reports/storage";

/** Remove one of the caller's reports; the public link stops working immediately. */

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readSession(request.cookies);
  if (!session) {
    return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!isReportId(id)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const removed = await deleteReport(id, session.uid);
  if (!removed) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
