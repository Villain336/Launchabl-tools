"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
  IconBoxAlignRightFilled,
} from "@tabler/icons-react";
import { motion } from "motion/react";

const LOGO = "/brand/logo.jpg";
const ORANGE_GRADIENT = "bg-gradient-to-r from-[#FF6600] to-[#FFB800]";

export default function BentoBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Every tool lives in an outcome cluster
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

const SkeletonOne = () => {
  const variants = {
    initial: { x: 0 },
    animate: { x: 10, rotate: 5, transition: { duration: 0.2 } },
  };
  const variantsSecond = {
    initial: { x: 0 },
    animate: { x: -10, rotate: -5, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row items-center space-x-2 rounded-full border border-border bg-background p-2"
      >
        <div className={cn("h-6 w-6 shrink-0 rounded-full", ORANGE_GRADIENT)} />
        <div className="h-4 w-full rounded-full bg-muted" />
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="ml-auto flex w-3/4 flex-row items-center space-x-2 rounded-full border border-border bg-background p-2"
      >
        <div className="h-4 w-full rounded-full bg-muted" />
        <div className={cn("h-6 w-6 shrink-0 rounded-full", ORANGE_GRADIENT)} />
      </motion.div>
      <motion.div
        variants={variants}
        className="flex flex-row items-center space-x-2 rounded-full border border-border bg-background p-2"
      >
        <div className={cn("h-6 w-6 shrink-0 rounded-full", ORANGE_GRADIENT)} />
        <div className="h-4 w-full rounded-full bg-muted" />
      </motion.div>
    </motion.div>
  );
};

const BAR_WIDTHS = ["85%", "62%", "94%", "48%", "73%", "57%"];

const SkeletonTwo = () => {
  const variants = {
    initial: { width: 0 },
    animate: { width: "100%", transition: { duration: 0.2 } },
    hover: { width: ["0%", "100%"], transition: { duration: 2 } },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2"
    >
      {BAR_WIDTHS.map((width, i) => (
        <motion.div
          key={"skelenton-two" + i}
          variants={variants}
          style={{ maxWidth: width }}
          className="flex h-4 w-full flex-row items-center space-x-2 rounded-full border border-border bg-muted p-2"
        />
      ))}
    </motion.div>
  );
};

const SkeletonThree = () => {
  const variants = {
    initial: { backgroundPosition: "0 50%" },
    animate: { backgroundPosition: ["0 50%", "100% 50%", "0 50%"] },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={variants}
      transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2 rounded-lg"
      style={{
        background: "linear-gradient(-45deg, #FF6600, #FFB800, #7c2d12, #FF6600)",
        backgroundSize: "400% 400%",
      }}
    >
      <motion.div className="h-full w-full rounded-lg" />
    </motion.div>
  );
};

const SkeletonFour = () => {
  const first = {
    initial: { x: 20, rotate: -5 },
    hover: { x: 0, rotate: 0 },
  };
  const second = {
    initial: { x: -20, rotate: 5 },
    hover: { x: 0, rotate: 0 },
  };
  return (
    <motion.div
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-row space-x-2"
    >
      <motion.div
        variants={first}
        className="flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border border-border bg-background p-4"
      >
        <img src={LOGO} alt="" height="100" width="100" className="h-10 w-10 rounded-md object-cover" />
        <p className="mt-4 text-center text-xs font-semibold text-muted-foreground sm:text-sm">
          Another DIY converter site
        </p>
        <p className="mt-4 rounded-full border border-red-500 bg-red-100 px-2 py-0.5 text-xs text-red-600">
          Dead end
        </p>
      </motion.div>
      <motion.div className="relative z-20 flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border border-border bg-background p-4">
        <img src={LOGO} alt="" height="100" width="100" className="h-10 w-10 rounded-md object-cover" />
        <p className="mt-4 text-center text-xs font-semibold text-muted-foreground sm:text-sm">
          Free tool, then unlimited agency
        </p>
        <p className="mt-4 rounded-full border border-[#FF6600] bg-orange-100 px-2 py-0.5 text-xs text-[#c2410c]">
          Launchabl
        </p>
      </motion.div>
      <motion.div
        variants={second}
        className="flex h-full w-1/3 flex-col items-center justify-center rounded-2xl border border-border bg-background p-4"
      >
        <img src={LOGO} alt="" height="100" width="100" className="h-10 w-10 rounded-md object-cover" />
        <p className="mt-4 text-center text-xs font-semibold text-muted-foreground sm:text-sm">
          Monthly retainer forever
        </p>
        <p className="mt-4 rounded-full border border-amber-500 bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
          Expensive
        </p>
      </motion.div>
    </motion.div>
  );
};

const SkeletonFive = () => {
  const variants = {
    initial: { x: 0 },
    animate: { x: 10, rotate: 5, transition: { duration: 0.2 } },
  };
  const variantsSecond = {
    initial: { x: 0 },
    animate: { x: -10, rotate: -5, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial="initial"
      whileHover="animate"
      className="flex h-full min-h-[6rem] w-full flex-1 flex-col space-y-2"
    >
      <motion.div
        variants={variants}
        className="flex flex-row items-start space-x-2 rounded-2xl border border-border bg-background p-2"
      >
        <img src={LOGO} alt="" height="100" width="100" className="h-10 w-10 rounded-md object-cover" />
        <p className="text-xs text-muted-foreground">
          We need a scored audit, a brand kit, and a report we can send to a client — not another
          file converter.
        </p>
      </motion.div>
      <motion.div
        variants={variantsSecond}
        className="ml-auto flex w-3/4 flex-row items-center justify-end space-x-2 rounded-full border border-border bg-background p-2"
      >
        <p className="text-xs text-muted-foreground">That&apos;s the unlimited plan.</p>
        <div className={cn("h-6 w-6 shrink-0 rounded-full", ORANGE_GRADIENT)} />
      </motion.div>
    </motion.div>
  );
};

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
    header: <SkeletonOne />,
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
    header: <SkeletonTwo />,
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
    header: <SkeletonThree />,
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
    header: <SkeletonFour />,
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
    header: <SkeletonFive />,
    className: "md:col-span-1",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-primary" />,
  },
];
