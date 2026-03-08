import type { AuthFile, CopilotAuthEntry } from "./types.js";
type ReadFileImpl = (filePath: string, encoding: BufferEncoding) => Promise<string>;
type WriteFileImpl = (filePath: string, content: string) => Promise<void>;
type RenameImpl = (from: string, to: string) => Promise<void>;
type MkdirImpl = (dirPath: string) => Promise<void>;
export declare function isCopilotAuthEntry(value: unknown): value is CopilotAuthEntry;
export declare function readAuthFile(authFilePath: string, readFileImpl?: ReadFileImpl): Promise<AuthFile>;
export declare function extractCopilotAuth(authFile: AuthFile): CopilotAuthEntry | null;
export declare function fingerprintAuth(entry: CopilotAuthEntry): string;
export declare function labelForAuth(entry: CopilotAuthEntry): string;
export declare function atomicWriteJson(filePath: string, value: unknown, deps?: {
    mkdirImpl?: MkdirImpl;
    writeFileImpl?: WriteFileImpl;
    renameImpl?: RenameImpl;
}): Promise<void>;
export declare function replaceCopilotAuth(params: {
    authFilePath: string;
    nextAuth: CopilotAuthEntry;
    readFileImpl?: ReadFileImpl;
    mkdirImpl?: MkdirImpl;
    writeFileImpl?: WriteFileImpl;
    renameImpl?: RenameImpl;
}): Promise<AuthFile>;
export {};
