"use client";

import { useState } from "react";
import ApprovalCard from "@/components/primitives/ApprovalCard";
import ChatComposer from "@/components/primitives/ChatComposer";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { triggerSpec } from "@/lib/studio-triggers";

export function StudioTrigger() {
  const run = useDeliveryRunOrThrow();
  const spec = triggerSpec(run.agent?.slug);
  const [asked, setAsked] = useState(false);

  return (
    <div className="space-y-3">
      <ChatComposer
        suggestions={spec.suggestions}
        messages={spec.messages}
        labels={{ initialPrompt: "", placeholder: spec.placeholder }}
        onSend={(text) => {
          run.setBrief(text);
          setAsked(true);
        }}
      />
      {asked && (
        <ApprovalCard
          questions={spec.questions}
          resettable={false}
          labels={{
            sentMessage: "Got it — fill anything left below, then run.",
            customPlaceholder: "Something else…",
          }}
        />
      )}
    </div>
  );
}
