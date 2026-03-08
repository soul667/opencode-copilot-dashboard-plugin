import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
export function isCopilotAuthEntry(value) {
    if (!value || typeof value !== "object")
        return false;
    const entry = value;
    return (entry.type === "oauth" &&
        typeof entry.refresh === "string" &&
        entry.refresh.length > 0 &&
        typeof entry.access === "string" &&
        entry.access.length > 0 &&
        typeof entry.expires === "number");
}
export async function readAuthFile(authFilePath, readFileImpl = (filePath, encoding) => fs.readFile(filePath, encoding)) {
    const raw = await readFileImpl(authFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
        throw new Error("OpenCode auth file does not contain a JSON object");
    }
    return parsed;
}
export function extractCopilotAuth(authFile) {
    const entry = authFile["github-copilot"];
    return isCopilotAuthEntry(entry) ? structuredClone(entry) : null;
}
export function fingerprintAuth(entry) {
    const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify({ refresh: entry.refresh, access: entry.access, expires: entry.expires }))
        .digest("hex");
    return hash.slice(0, 12);
}
export function labelForAuth(entry) {
    const tokenTail = entry.access.slice(-4) || entry.refresh.slice(-4) || "acct";
    return `copilot-${tokenTail}`;
}
export async function atomicWriteJson(filePath, value, deps) {
    const dirPath = path.dirname(filePath);
    const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    const mkdirImpl = deps?.mkdirImpl ?? ((target) => fs.mkdir(target, { recursive: true }));
    const writeFileImpl = deps?.writeFileImpl ?? ((target, content) => fs.writeFile(target, content, "utf8"));
    const renameImpl = deps?.renameImpl ?? ((from, to) => fs.rename(from, to));
    await mkdirImpl(dirPath);
    await writeFileImpl(tempPath, `${JSON.stringify(value, null, 2)}\n`);
    await renameImpl(tempPath, filePath);
}
export async function replaceCopilotAuth(params) {
    const authFile = await readAuthFile(params.authFilePath, params.readFileImpl);
    const nextFile = { ...authFile, "github-copilot": structuredClone(params.nextAuth) };
    await atomicWriteJson(params.authFilePath, nextFile, {
        mkdirImpl: params.mkdirImpl,
        writeFileImpl: params.writeFileImpl,
        renameImpl: params.renameImpl,
    });
    return nextFile;
}
