"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrgRole = "owner" | "admin" | "member";
type OrgRecord = { id: string; name: string; ownerUid: string; createdAt: string; updatedAt: string };
type OrgMember = { uid: string; email: string; name: string | null; role: OrgRole };
type OrgInvite = { token: string; orgId: string; email: string; role: "admin" | "member"; invitedByUid: string; createdAt: string };
type OrgState = { org: OrgRecord | null; role: OrgRole | null; members: OrgMember[]; pendingInvites: OrgInvite[] };

async function loadOrg(): Promise<OrgState> {
  const res = await fetch("/api/orgs", { credentials: "same-origin", cache: "no-store" });
  if (!res.ok) return { org: null, role: null, members: [], pendingInvites: [] };
  return (await res.json()) as OrgState;
}

const canManage = (role: OrgRole | null) => role === "owner" || role === "admin";

export function TeamManager() {
  const session = useSession();
  const [state, setState] = useState<OrgState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadOrg().then(setState);
  }, [session.status, session.user]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Link href="/sign-in?next=/team" className="text-primary underline">
            Sign in
          </Link>{" "}
          to create or manage a team.
        </CardContent>
      </Card>
    );
  }
  if (!state) return <p className="text-sm text-muted-foreground">Loading…</p>;

  async function run<T>(action: () => Promise<Response>, onOk?: () => void): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await action();
      const body = (await res.json().catch(() => ({}))) as { error?: string } & Partial<T>;
      if (!res.ok) {
        setError(body.error ?? "Something went wrong.");
        return;
      }
      onOk?.();
      setState(await loadOrg());
    } finally {
      setBusy(false);
    }
  }

  if (!state.org) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create a team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Give your agency or company a shared account: teammates get their own sign-in, an
            admin can manage seats, and every action is recorded in the audit log.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Agency" disabled={busy} />
            <Button
              disabled={busy || !orgName.trim()}
              onClick={() =>
                void run(() => fetch("/api/orgs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: orgName }) }), () => setOrgName(""))
              }
            >
              Create team
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Have an invite link instead? <Link href="/team/join" className="underline">Accept it here</Link>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { org, role, members, pendingInvites } = state;
  const isOwner = role === "owner";
  const uid = members.find((m) => m.email.toLowerCase() === session.user?.email.toLowerCase())?.uid;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{org.name}</CardTitle>
          <span className="rounded-[4px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">{role}</span>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-600">{notice}</p>}

          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Members ({members.length})</h3>
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <li key={m.uid} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="truncate">
                    {m.name || m.email}
                    {m.name && <span className="ml-1 text-muted-foreground">({m.email})</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase">{m.role}</span>
                    {canManage(role) && m.role !== "owner" && m.uid !== uid && (
                      <>
                        {isOwner && (
                          <select
                            className="h-7 rounded-md border border-input bg-transparent px-1 text-xs"
                            value={m.role}
                            disabled={busy}
                            onChange={(e) =>
                              void run(() =>
                                fetch(`/api/orgs/${org.id}/members/${m.uid}`, {
                                  method: "PATCH",
                                  headers: { "content-type": "application/json" },
                                  body: JSON.stringify({ role: e.target.value }),
                                }),
                              )
                            }
                          >
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                          </select>
                        )}
                        <Button
                          variant="destructive"
                          size="xs"
                          disabled={busy}
                          onClick={() => void run(() => fetch(`/api/orgs/${org.id}/members/${m.uid}`, { method: "DELETE" }))}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                    {m.uid === uid && m.role !== "owner" && (
                      <Button variant="outline" size="xs" disabled={busy} onClick={() => void run(() => fetch(`/api/orgs/${org.id}/members/${m.uid}`, { method: "DELETE" }))}>
                        Leave
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {canManage(role) && (
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Invite a teammate</h3>
              <div className="flex flex-wrap gap-2">
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com" type="email" disabled={busy} className="max-w-xs" />
                <select className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "admin" | "member")} disabled={busy}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  disabled={busy || !inviteEmail.trim()}
                  onClick={() =>
                    void run(
                      () =>
                        fetch(`/api/orgs/${org.id}/invites`, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
                        }),
                      () => {
                        setInviteEmail("");
                        setNotice("Invite sent.");
                      },
                    )
                  }
                >
                  Invite
                </Button>
              </div>
            </div>
          )}

          {canManage(role) && pendingInvites.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Pending invites</h3>
              <ul className="flex flex-col gap-2">
                {pendingInvites.map((invite) => (
                  <li key={invite.token} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="truncate">
                      {invite.email} <span className="text-xs text-muted-foreground uppercase">({invite.role})</span>
                    </span>
                    <Button variant="outline" size="xs" disabled={busy} onClick={() => void run(() => fetch(`/api/orgs/${org.id}/invites/${invite.token}`, { method: "DELETE" }))}>
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isOwner && (
            <div className="border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-semibold tracking-widest text-destructive uppercase">Danger zone</h3>
              <Button
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (confirm(`Delete ${org.name}? This removes everyone's membership immediately.`)) void run(() => fetch(`/api/orgs/${org.id}`, { method: "DELETE" }));
                }}
              >
                Delete team
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
