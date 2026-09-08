"use client";

import CodeBlock from "@/components/primitives/CodeBlock";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";

export function StudioCode() {
  const run = useDeliveryRunOrThrow();
  const artifact = run.deliverable?.artifacts.find((item) => item.text);
  if (!artifact?.text) return null;

  const lines = artifact.text.split("\n").slice(0, 40);
  return (
    <CodeBlock
      filename={artifact.name}
      lines={lines}
      code={artifact.text}
      labels={{ copy: "Copy", copied: "Copied" }}
    />
  );
}
