import Image from "next/image";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";

export function BrandMark({
  size = 32,
  withWordmark = true,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/logo.jpg"
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
        priority
      />
      {withWordmark && <span className="font-bold tracking-tight">{siteConfig.name}</span>}
    </span>
  );
}
