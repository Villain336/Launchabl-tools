import JSZip from "jszip";
import { isIgnoredPath, looksBinary, looksBinaryByName, makeFile, normalisePath, stripCommonRoot, WORKSPACE_LIMITS, type WorkspaceFile } from "@/lib/ide/workspace";

export type ImportReport = {
  files: WorkspaceFile[];
  skipped: { path: string; reason: string }[];
  totalBytes: number;
};

const decoder = new TextDecoder("utf-8", { fatal: false });

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Turn raw bytes into a workspace file, deciding text vs binary and enforcing size limits. */
export function fileFromBytes(path: string, bytes: Uint8Array): { file: WorkspaceFile } | { skip: string } {
  if (bytes.length > WORKSPACE_LIMITS.textBytes * 4) return { skip: "over 6 MB" };
  const binary = looksBinaryByName(path) || looksBinary(bytes);
  if (binary) return { file: makeFile(path, bytesToBase64(bytes), { binary: true, size: bytes.length }) };
  if (bytes.length > WORKSPACE_LIMITS.textBytes) return { skip: "text file over 1.5 MB" };
  const text = decoder.decode(bytes).replace(/\r\n/g, "\n");
  return { file: makeFile(path, text, { size: bytes.length }) };
}

/** Import a list of (path, bytes) entries — from a ZIP, a folder drop or a repo tarball. */
export function importEntries(entries: { path: string; bytes: Uint8Array }[]): ImportReport {
  const strip = stripCommonRoot(entries.map((e) => e.path));
  const skipped: ImportReport["skipped"] = [];
  const files: WorkspaceFile[] = [];
  let totalBytes = 0;
  for (const entry of entries) {
    const path = normalisePath(strip(entry.path));
    if (!path) continue;
    if (isIgnoredPath(path)) {
      skipped.push({ path, reason: "ignored folder" });
      continue;
    }
    if (files.length >= WORKSPACE_LIMITS.files) {
      skipped.push({ path, reason: `over ${WORKSPACE_LIMITS.files} files` });
      continue;
    }
    if (totalBytes + entry.bytes.length > WORKSPACE_LIMITS.totalBytes) {
      skipped.push({ path, reason: "workspace over 60 MB" });
      continue;
    }
    const result = fileFromBytes(path, entry.bytes);
    if ("skip" in result) {
      skipped.push({ path, reason: result.skip });
      continue;
    }
    files.push(result.file);
    totalBytes += entry.bytes.length;
  }
  return { files, skipped, totalBytes };
}

export async function importZip(data: ArrayBuffer | Uint8Array | Blob): Promise<ImportReport> {
  const zip = await JSZip.loadAsync(data);
  const entries: { path: string; bytes: Uint8Array }[] = [];
  const candidates = Object.values(zip.files).filter((f) => !f.dir && !isIgnoredPath(f.name));
  for (const entry of candidates) {
    entries.push({ path: entry.name, bytes: await entry.async("uint8array") });
  }
  return importEntries(entries);
}

/** Browser File objects from an <input multiple webkitdirectory> or a drop. */
export async function importBrowserFiles(list: File[]): Promise<ImportReport> {
  const entries: { path: string; bytes: Uint8Array }[] = [];
  for (const file of list) {
    const rel = ((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name).replace(/^\.?\//, "");
    if (isIgnoredPath(rel)) continue;
    entries.push({ path: rel, bytes: new Uint8Array(await file.arrayBuffer()) });
  }
  return importEntries(entries);
}

export async function exportZip(files: Record<string, WorkspaceFile>): Promise<Blob> {
  const zip = new JSZip();
  for (const file of Object.values(files)) {
    if (file.binary) zip.file(file.path, base64ToBytes(file.content));
    else zip.file(file.path, file.content);
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
