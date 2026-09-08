import { clsx } from "clsx";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-slate-600">{description}</p>}
    </div>
  );
}
