"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ComponentProps } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const transition = {
  type: "spring" as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
}) => {
  return (
    <div onMouseEnter={() => setActive(item)} className="relative">
      <motion.p
        transition={{ duration: 0.3 }}
        className="cursor-pointer text-sm font-medium text-foreground hover:text-primary"
      >
        {item}
      </motion.p>
      {active !== null && children && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className="absolute top-full left-1/2 z-50 w-max min-w-[12rem] -translate-x-1/2 pt-4 pointer-events-auto">
              <motion.div
                transition={transition}
                layoutId="active"
                className="overflow-hidden rounded-2xl border border-border bg-popover shadow-xl backdrop-blur-sm"
              >
                <motion.div layout className="h-full w-max p-4">
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
  className,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  return (
    <nav
      onMouseEnter={cancelClose}
      onMouseLeave={() => {
        cancelClose();
        closeTimer.current = setTimeout(() => setActive(null), 500);
      }}
      className={cn(
        "relative z-50 flex justify-center space-x-6 overflow-visible rounded-full border border-border bg-background px-6 py-2 shadow-sm",
        className,
      )}
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <Link href={href} className="flex space-x-3">
      <Image
        src={src}
        width={140}
        height={70}
        alt=""
        className="h-[70px] w-[140px] shrink-0 rounded-md bg-white object-contain p-1 shadow-md"
      />
      <div>
        <h4 className="mb-1 text-base font-bold text-foreground">{title}</h4>
        <p className="max-w-[12rem] text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
};

export const HoveredLink = ({
  children,
  className,
  ...rest
}: ComponentProps<typeof Link>) => {
  return (
    <Link
      {...rest}
      className={cn("text-muted-foreground hover:text-primary", className)}
    >
      {children}
    </Link>
  );
};
