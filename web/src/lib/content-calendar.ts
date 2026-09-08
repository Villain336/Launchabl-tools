import { hashString } from "@/lib/brand-name-generator";

export type CalendarEntry = {
  day: number;
  channel: string;
  theme: string;
  idea: string;
};

const channelsByGoal: Record<string, string[]> = {
  awareness: ["Instagram", "TikTok", "Blog", "Email"],
  leads: ["Email", "LinkedIn", "Blog", "Landing page"],
  sales: ["Email", "Instagram", "Google Ads", "SMS"],
  retention: ["Email", "Instagram", "Community", "SMS"],
};

const themesByWeek = [
  "Educate — teach something your audience doesn't know",
  "Prove — show results, testimonials, or behind-the-scenes proof",
  "Offer — a clear, time-bound call to action",
  "Connect — community, culture, and the people behind the brand",
];

const ideaTemplates = [
  (b: string) => `Share a "before/after" story from a ${b} customer`,
  (b: string) => `Post a quick tip related to what ${b} solves`,
  (b: string) => `Behind-the-scenes look at how ${b} does the work`,
  (b: string) => `Answer a common question about ${b} in one short post`,
  (b: string) => `Highlight a specific result or number from ${b}`,
  (b: string) => `Repurpose your top-performing post from last month for ${b}`,
  (b: string) => `Feature a customer or team member story from ${b}`,
  (b: string) => `Run a limited-time offer post for ${b}`,
  (b: string) => `Share a myth vs. fact post relevant to ${b}'s industry`,
  (b: string) => `Post a short how-to related to ${b}'s product/service`,
];

export function generateCalendar(brand: string, goal: string, days = 30): CalendarEntry[] {
  const b = brand.trim() || "your brand";
  const channels = channelsByGoal[goal] ?? channelsByGoal.awareness;
  const entries: CalendarEntry[] = [];

  for (let day = 1; day <= days; day++) {
    const hash = hashString(`${b}-${goal}-${day}`);
    const channel = channels[hash % channels.length];
    const week = Math.floor((day - 1) / 7) % themesByWeek.length;
    const theme = themesByWeek[week];
    const idea = ideaTemplates[hash % ideaTemplates.length](b);
    entries.push({ day, channel, theme, idea });
  }

  return entries;
}

export function calendarToCsv(entries: CalendarEntry[]): string {
  const header = "Day,Channel,Weekly Theme,Content Idea";
  const rows = entries.map(
    (e) => `${e.day},"${e.channel}","${e.theme.replace(/"/g, '""')}","${e.idea.replace(/"/g, '""')}"`,
  );
  return [header, ...rows].join("\n");
}
