"use client";

import WorldMap from "@/components/ui/world-map";
import { motion } from "motion/react";

export default function WorldMapVisibility() {
  return (
    <section className="w-full border-t border-border bg-background py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Increase{" "}
          <span className="text-muted-foreground">
            {"exposure".split("").map((letter, idx) => (
              <motion.span
                key={idx}
                className="inline-block"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.04 }}
              >
                {letter}
              </motion.span>
            ))}
          </span>{" "}
          and visibility
        </p>
        <p className="mx-auto max-w-2xl py-4 text-base text-muted-foreground md:text-lg">
          Schema, technical SEO, and on-brand content that search engines actually reward —
          so your brand shows up in more cities, more queries, and more conversations than
          a one-off campaign ever could.
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <WorldMap
          lineColor="#FF6600"
          dots={[
            {
              start: { lat: 37.7749, lng: -122.4194 },
              end: { lat: 40.7128, lng: -74.006 },
            },
            {
              start: { lat: 40.7128, lng: -74.006 },
              end: { lat: 51.5074, lng: -0.1278 },
            },
            {
              start: { lat: 51.5074, lng: -0.1278 },
              end: { lat: 48.8566, lng: 2.3522 },
            },
            {
              start: { lat: 51.5074, lng: -0.1278 },
              end: { lat: 28.6139, lng: 77.209 },
            },
            {
              start: { lat: 1.3521, lng: 103.8198 },
              end: { lat: -33.8688, lng: 151.2093 },
            },
            {
              start: { lat: 34.0522, lng: -118.2437 },
              end: { lat: -23.5505, lng: -46.6333 },
            },
          ]}
        />
      </div>
    </section>
  );
}
