"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  revealDelayMs?: number;
  charset?: string;
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
  /** How long to leave the real word readable before looping. */
  holdMs?: number;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(original: string, charset: string): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    result += original[i] === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 180,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 110,
  encryptedClassName,
  revealedClassName,
  holdMs = 4500,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const animationFrameRef = useRef<number | null>(null);

  const [revealCount, setRevealCount] = useState(text.length);
  const [scramble, setScramble] = useState(text);

  useEffect(() => {
    if (!isInView) return;

    let cancelled = false;
    let revealLocal = text.length;
    let scrambleLocal = text;
    let lastFlip = 0;
    let holding = true;
    let holdStart = performance.now();
    let cycleStart = holdStart;

    const tick = (now: number) => {
      if (cancelled) return;

      if (holding) {
        if (now - holdStart >= holdMs) {
          holding = false;
          revealLocal = 0;
          scrambleLocal = generateGibberishPreservingSpaces(text, charset);
          cycleStart = now;
          lastFlip = now;
          setRevealCount(0);
          setScramble(scrambleLocal);
        }
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const totalLength = text.length;
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor((now - cycleStart) / Math.max(1, revealDelayMs)),
      );

      if (now - lastFlip >= Math.max(0, flipDelayMs) && currentRevealCount < totalLength) {
        const chars = scrambleLocal.split("");
        for (let index = currentRevealCount; index < totalLength; index += 1) {
          chars[index] = text[index] === " " ? " " : generateRandomCharacter(charset);
        }
        scrambleLocal = chars.join("");
        lastFlip = now;
        setScramble(scrambleLocal);
      }

      if (currentRevealCount !== revealLocal) {
        revealLocal = currentRevealCount;
        setRevealCount(currentRevealCount);
      }

      if (currentRevealCount >= totalLength) {
        holding = true;
        holdStart = now;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs, holdMs]);

  if (!text) return null;

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block min-w-[9ch] font-semibold tracking-tight", className)}
      aria-label={text}
    >
      {text.split("").map((char, index) => {
        const isRevealed = index < revealCount;
        const displayChar = isRevealed ? char : char === " " ? " " : (scramble[index] ?? char);

        return (
          <span
            key={index}
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
          >
            {displayChar}
          </span>
        );
      })}
    </motion.span>
  );
};
