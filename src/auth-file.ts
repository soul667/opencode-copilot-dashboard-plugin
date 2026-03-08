import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { AuthFile, CopilotAuthEntry } from "./types.js";

type ReadFileImpl = (filePath: string, encoding: BufferEncoding) => Promise<string>;
type WriteFileImpl = (filePath: string, content: string) => Promise<void>;
type RenameImpl = (from: string, to: string) => Promise<void>;
type MkdirImpl = (dirPath: string) => Promise<void>;

export function isCopilotAuthEntry(value: unknown): value is CopilotAuthEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    entry.type === "oauth" &&
    typeof entry.refresh === "string" &&
    entry.refresh.length > 0 &&
    typeof entry.access === "string" &&
    entry.access.length > 0 &&
    typeof entry.expires === "number"
  );
}

export async function readAuthFile(
  authFilePath: string,
  readFileImpl: ReadFileImpl = (filePath, encoding) => fs.readFile(filePath, encoding),
): Promise<AuthFile> {
  const raw = await readFileImpl(authFilePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenCode auth file does not contain a JSON object");
  }
  return parsed as AuthFile;
}

export function extractCopilotAuth(authFile: AuthFile): CopilotAuthEntry | null {
  const entry = authFile["github-copilot"];
  return isCopilotAuthEntry(entry) ? structuredClone(entry) : null;
}

export function fingerprintAuth(entry: CopilotAuthEntry): string {
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ refresh: entry.refresh, access: entry.access, expires: entry.expires }))
    .digest("hex");
  return hash.slice(0, 12);
}

export function labelForAuth(entry: CopilotAuthEntry): string {
  const tokenTail = entry.access.slice(-4) || entry.refresh.slice(-4) || "acct";
  return `copilot-${tokenTail}`;
}

export async function atomicWriteJson(
  filePath: string,
  value: unknown,
  deps?: {
    mkdirImpl?: MkdirImpl;
    writeFileImpl?: WriteFileImpl;
    renameImpl?: RenameImpl;
  },
): Promise<void> {
  const dirPath = path.dirname(filePath);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const mkdirImpl = deps?.mkdirImpl ?? ((target) => fs.mkdir(target, { recursive: true }));
  const writeFileImpl = deps?.writeFileImpl ?? ((target, content) => fs.writeFile(target, content, "utf8"));
  const renameImpl = deps?.renameImpl ?? ((from, to) => fs.rename(from, to));

  await mkdirImpl(dirPath);
  await writeFileImpl(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  await renameImpl(tempPath, filePath);
}

export async function replaceCopilotAuth(params: {
  authFilePath: string;
  nextAuth: CopilotAuthEntry;
  readFileImpl?: ReadFileImpl;
  mkdirImpl?: MkdirImpl;
  writeFileImpl?: WriteFileImpl;
  renameImpl?: RenameImpl;
}): Promise<AuthFile> {
  const authFile = await readAuthFile(params.authFilePath, params.readFileImpl);
  const nextFile: AuthFile = { ...authFile, "github-copilot": structuredClone(params.nextAuth) };
  await atomicWriteJson(params.authFilePath, nextFile, {
    mkdirImpl: params.mkdirImpl,
    writeFileImpl: params.writeFileImpl,
    renameImpl: params.renameImpl,
  });
  return nextFile;
}
