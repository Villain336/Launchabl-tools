"use client";

import { useMemo, useState } from "react";
import { FileUp, Globe } from "lucide-react";

import { ConditionRows, type ConditionLine } from "@/components/flow/condition-rows";
import { useDeliveryRun } from "@/components/tools/delivery-run";

export function ReviewGates() {
  const run = useDeliveryRun();
  const [values, setValues] = useState<Record<string, string>>({});

  const { lines, resolved } = useMemo(() => {
    const sources = run?.deliverable?.sources ?? [];
    const skills = run?.skillLog ?? [];
    const required = run?.agent?.requiredAccuracy ?? [];
    const first = sources[0];
    const sourceItems =
      sources.length === 0
        ? [{ name: "waiting", tag: "No fetch yet" }]
        : sources.map((source) => ({ name: source.kind, tag: source.note }));
    const accuracyItems =
      required.length === 0
        ? [{ name: "ready", tag: "No extra gate" }]
        : required.map((id) => {
            const skill = skills.find((item) => item.id === id);
            return { name: skill?.label ?? id, tag: skill?.status ?? "queued" };
          });
    const lines: ConditionLine[] = [
      {
        join: "If",
        source: first?.kind === "operator-provided" ? "file" : "page",
        sourceIcon:
          first?.kind === "operator-provided" ? <FileUp className="size-3" /> : <Globe className="size-3" />,
        fieldId: "field1",
        fieldItems: [
          { name: "source", tag: "Fetch" },
          { name: "accuracy", tag: "Gate" },
        ],
        valueId: "val1",
        valueItems: sourceItems,
      },
      {
        join: "and",
        source: "skills",
        fieldId: "field2",
        fieldItems: [
          { name: "accuracy", tag: "Gate" },
          { name: "skills", tag: "Run" },
        ],
        valueId: "val2",
        valueItems: accuracyItems,
      },
    ];
    return {
      lines,
      resolved: {
        field1: values.field1 ?? "source",
        val1: values.val1 ?? sourceItems[0]?.name ?? "waiting",
        field2: values.field2 ?? "accuracy",
        val2: values.val2 ?? accuracyItems[0]?.name ?? "ready",
      },
    };
  }, [run, values]);

  return (
    <ConditionRows
      lines={lines}
      values={resolved}
      onChange={(id, name) => setValues((current) => ({ ...current, [id]: name }))}
    />
  );
}
