"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Circle, Download, Mic, MicOff, Monitor, Square } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";

type RecorderState = "idle" | "recording" | "stopped";

function pickMimeType(): string {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "video/webm";
}

export function DemoVideoCreator() {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState("madewith.yourbrand.com");
  const [accentColor, setAccentColor] = useState("#4f46e5");
  const [includeMic, setIncludeMic] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopEverything = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    canvasStreamRef.current?.getTracks().forEach((t) => t.stop());
  };

  useEffect(() => {
    return () => {
      stopEverything();
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawLoop = () => {
    const video = videoElRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== video.videoWidth && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (watermarkText.trim()) {
      const padding = Math.round(canvas.width * 0.015);
      const fontSize = Math.max(14, Math.round(canvas.width * 0.016));
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      const textWidth = ctx.measureText(watermarkText).width;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = fontSize + padding * 1.2;
      const x = canvas.width - boxWidth - padding;
      const y = canvas.height - boxHeight - padding;

      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + boxWidth, y, x + boxWidth, y + boxHeight, radius);
      ctx.arcTo(x + boxWidth, y + boxHeight, x, y + boxHeight, radius);
      ctx.arcTo(x, y + boxHeight, x, y, radius);
      ctx.arcTo(x, y, x + boxWidth, y, radius);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = accentColor;
      ctx.fillRect(x, y, 4, boxHeight);

      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      ctx.fillText(watermarkText, x + padding + 6, y + boxHeight / 2);
    }

    rafRef.current = requestAnimationFrame(drawLoop);
  };

  const start = async () => {
    setError(null);
    setVideoUrl(null);
    chunksRef.current = [];

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen recording isn't supported in this browser. Try the latest Chrome, Edge, or Firefox.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      displayStreamRef.current = displayStream;

      let micStream: MediaStream | null = null;
      if (includeMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;
        } catch {
          setError("Couldn't access your microphone — continuing without it.");
        }
      }

      const video = videoElRef.current!;
      video.srcObject = displayStream;
      await video.play();

      rafRef.current = requestAnimationFrame(drawLoop);

      const canvas = canvasRef.current!;
      const canvasStream = canvas.captureStream(30);
      canvasStreamRef.current = canvasStream;

      const audioTracks = [
        ...displayStream.getAudioTracks(),
        ...(micStream ? micStream.getAudioTracks() : []),
      ];
      const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

      const recorder = new MediaRecorder(combined, { mimeType: pickMimeType() });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoUrl(URL.createObjectURL(blob));
      };
      recorder.start(1000);

      displayStream.getVideoTracks()[0]?.addEventListener("ended", () => stop());

      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setState("recording");
    } catch (err) {
      setError(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Screen-share permission was denied."
          : "Couldn't start screen recording.",
      );
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    stopEverything();
    setState("stopped");
  };

  const format = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Watermark text</label>
          <input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            disabled={state === "recording"}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
            placeholder="yourbrand.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Accent color</label>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            disabled={state === "recording"}
            className="h-10 w-full cursor-pointer rounded-lg border border-slate-200"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={includeMic}
          disabled={state === "recording"}
          onChange={(e) => setIncludeMic(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {includeMic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        Include microphone audio
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        {state !== "recording" ? (
          <Button onClick={start}>
            <Monitor className="h-4 w-4" /> Start recording
          </Button>
        ) : (
          <Button variant="secondary" onClick={stop}>
            <Square className="h-4 w-4 fill-current text-red-600" /> Stop ({format(elapsed)})
          </Button>
        )}
        {state === "recording" && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <Circle className="h-2.5 w-2.5 animate-pulse fill-current" /> Recording…
          </span>
        )}
      </div>

      <div className={state === "recording" ? "mt-6" : "mt-6 hidden"}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
        <canvas ref={canvasRef} className="w-full rounded-xl border border-slate-200 bg-slate-900" />
      </div>
      <video ref={videoElRef} muted playsInline className="hidden" />

      {videoUrl && state === "stopped" && (
        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Your recording</p>
          <video src={videoUrl} controls className="w-full rounded-xl border border-slate-200 bg-slate-900" />
          <Button
            className="mt-3"
            onClick={async () => {
              const res = await fetch(videoUrl);
              const blob = await res.blob();
              downloadBlob(blob, "demo-video.webm");
            }}
          >
            <Download className="h-4 w-4" /> Download video
          </Button>
        </div>
      )}
    </div>
  );
}
