"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { ScheduleForm } from "@/components/schedules/schedule-form";
import { useSession } from "@/lib/auth/use-session";
import { currentProject } from "@/lib/projects/use-projects";

/**
 * "Schedule" in the chat header: turn the current brief into a recurring
 * automation. Anonymous users are sent to sign in first (schedules email a
 * report link, so they need an account).
 */
export function ScheduleButton({ slug, brief }: { slug: string; brief: string | null }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  if (session.status !== "ready") return null;

  const onClick = () => {
    if (!session.user) {
      router.push(`/sign-in?next=${encodeURIComponent(pathname ?? "/tools")}&source=schedule:${slug}`);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        title="Run this job on a schedule"
        aria-label="Schedule this job"
        className={`flex h-7 items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium transition-colors duration-100 hover:bg-hover ${saved ? "text-green" : "text-ink-3 hover:text-ink"}`}
        data-schedule-button
      >
        <CalendarClock className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{saved ? "Scheduled" : "Schedule"}</span>
      </button>
      {open && (
        <ScheduleForm
          defaults={{ slug, prompt: brief ?? "", projectId: currentProject()?.id ?? null }}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
        />
      )}
    </>
  );
}
