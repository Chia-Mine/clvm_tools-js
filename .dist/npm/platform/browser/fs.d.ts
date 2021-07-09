export declare function readFileSync(path: string, option?: {
    encoding: "utf8";
}): string;
export declare function writeFileSync(path: string, data: string): void;
export declare function existsSync(path: string): boolean;
export declare function statSync(path: string): {
    isFile: () => boolean;
    mtimeMs: number;
};
export declare function readdirSync(path: string): {
    name: string;
    isDirectory: () => boolean;
}[];
