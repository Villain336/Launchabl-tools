"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
  IconBoxAlignRightFilled,
} from "@tabler/icons-react";
import { artForCluster } from "@/lib/marquee-art";

export default function BentoBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Every outcome lives in a cluster
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Not a junk drawer of converters. Six jobs a marketer, founder, or developer actually has.
          </p>
        </div>

        <BentoGrid className="mx-auto mt-12 max-w-4xl md:auto-rows-[20rem]">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={cn("[&>p:text-lg]", item.className)}
              icon={item.icon}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

function ClusterVisual({ slug }: { slug: string }) {
  return (
    <div className="relative flex h-full min-h-[6rem] w-full flex-1 items-center justify-center overflow-hidden rounded-xl bg-white">
      <Image
        src={artForCluster(slug)}
        alt=""
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-contain p-3"
      />
    </div>
  );
}

function DualClusterVisual({ slugs }: { slugs: [string, string] }) {
  return (
    <div className="flex h-full min-h-[6rem] w-full flex-1 gap-2">
      {slugs.map((slug) => (
        <div
          key={slug}
          className="relative flex-1 overflow-hidden rounded-xl bg-white"
        >
          <Image
            src={artForCluster(slug)}
            alt=""
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-contain p-3"
          />
        </div>
      ))}
    </div>
  );
}

const items = [
  {
    title: (
      <Link href="/tools#launch" className="hover:text-primary">
        Launch a brand
      </Link>
    ),
    description: (
      <span className="text-sm">
        Name it, claim the domain, stand up hosting, and write the copy — the full 0-to-1 stack.
      </span>
    ),
    header: <ClusterVisual slug="launch" />,
    className: "md:col-span-1",
    icon: <IconClipboardCopy className="h-4 w-4 text-primary" />,
  },
  {
    title: (
      <Link href="/tools#get-found" className="hover:text-primary">
        Get found
      </Link>
    ),
    description: (
      <span className="text-sm">
        Structured data and technical SEO fixes search engines actually reward.
      </span>
    ),
    header: <ClusterVisual slug="get-found" />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-primary" />,
  },
  {
    title: (
      <Link href="/tools#create-produce" className="hover:text-primary">
        Create & produce
      </Link>
    ),
    description: (
      <span className="text-sm">
        Record, edit, and produce real marketing assets without extra software.
      </span>
    ),
    header: <ClusterVisual slug="create-produce" />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-primary" />,
  },
  {
    title: (
      <Link href="/tools#protect" className="hover:text-primary">
        Protect, convert, and ship
      </Link>
    ),
    description: (
      <span className="text-sm">
        Watermark, strip metadata, and turn files into the format you actually need — in the browser.
      </span>
    ),
    header: <DualClusterVisual slugs={["protect", "convert-ship"]} />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-primary" />,
  },
  {
    title: (
      <Link href="/tools#audits-reports" className="hover:text-primary">
        Audits, kits & reports
      </Link>
    ),
    description: (
      <span className="text-sm">
        Heavier, multi-part deliverables other free tool sites don&apos;t attempt.
      </span>
    ),
    header: <ClusterVisual slug="audits-reports" />,
    className: "md:col-span-1",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-primary" />,
  },
];
