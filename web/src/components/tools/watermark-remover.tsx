"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Upload } from "lucide-react";
import { Button } from "@/components/ui/agency-button";

export function WatermarkRemover() {
  const [attested, setAttested] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div>
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Ownership required before use</p>
          <p className="mt-1">
            This tool is only for content you own or have explicit rights to edit — for example,
            removing a watermark you added yourself with our Watermark Generator. It must never be
            used on stock photography or third-party copyrighted content. See our{" "}
            <a href="/legal/acceptable-use" className="underline">
              Acceptable Use Policy
            </a>
            .
          </p>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={attested}
          onChange={(e) => setAttested(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        I own this image or have explicit, documented rights to edit it, and I am not removing a
        watermark from stock, licensed, or third-party content.
      </label>

      <div className="mt-6">
        <label
          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            attested ? "cursor-pointer border-border hover:border-primary" : "cursor-not-allowed border-border opacity-50"
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {file ? file.name : "Drop an image, or click to choose one"}
          </span>
          <span className="text-xs text-muted-foreground">Requires the attestation above</span>
          <input
            type="file"
            accept="image/*"
            disabled={!attested}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </label>
      </div>

      {file && attested && (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-muted p-5 text-sm text-muted-foreground">
          <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Processing engine not connected yet</p>
            <p className="mt-1">
              Production wires this step to a server-side inpainting model or API (never
              client-side — the model weights are too large to ship to the browser). The
              attestation above is logged server-side alongside the request for compliance.
            </p>
          </div>
        </div>
      )}

      <Button className="mt-6" disabled={!file || !attested}>
        Remove watermark
      </Button>
    </div>
  );
}
