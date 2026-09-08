"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type ThreeDMarqueeCard = {
  src: string;
  title: string;
};

export const ThreeDMarquee = ({
  images,
  cards,
  className,
}: {
  images?: string[];
  cards?: ThreeDMarqueeCard[];
  className?: string;
}) => {
  const items: ThreeDMarqueeCard[] =
    cards ??
    (images ?? []).map((src, i) => ({
      src,
      title: `Image ${i + 1}`,
    }));

  const chunkSize = Math.ceil(items.length / 4);
  const chunks = Array.from({ length: 4 }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return items.slice(start, start + chunkSize);
  });

  return (
    <div
      className={cn(
        "mx-auto block h-[600px] overflow-hidden rounded-2xl max-sm:h-100",
        className,
      )}
    >
      <div className="flex size-full items-center justify-center">
        <div className="size-[1720px] shrink-0 scale-50 sm:scale-75 lg:scale-100">
          <div
            style={{
              transform: "rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
            }}
            className="relative top-96 right-[50%] grid size-full origin-top-left grid-cols-4 gap-8 transform-3d"
          >
            {chunks.map((subarray, colIndex) => (
              <motion.div
                animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
                transition={{
                  duration: colIndex % 2 === 0 ? 10 : 15,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                key={colIndex + "marquee"}
                className="flex flex-col items-start gap-8"
              >
                <GridLineVertical className="-left-4" offset="80px" />
                {subarray.map((item, imageIndex) => (
                  <div className="relative" key={`${colIndex}-${imageIndex}-${item.title}`}>
                    <GridLineHorizontal className="-top-4" offset="20px" />
                    <motion.div
                      whileHover={{ y: -10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="relative aspect-[970/700] w-full overflow-hidden rounded-lg bg-[#171717] ring ring-[#FF6600]/25 hover:shadow-2xl"
                    >
                      {/* Decorative marquee tiles; next/image is a poor fit inside the 3D grid. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt=""
                        width={970}
                        height={700}
                        className="absolute inset-0 size-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
                      <p className="absolute inset-x-0 bottom-0 truncate px-6 pb-6 text-2xl font-semibold tracking-tight text-white">
                        {item.title}
                      </p>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(255, 102, 0, 0.35)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px",
          "--color-dark": "rgba(255, 184, 0, 0.35)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(255, 102, 0, 0.35)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(255, 184, 0, 0.35)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};
