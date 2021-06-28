import { Bytes, str, Stream } from "clvm";
export declare function fs_write(path: string, data: string): void;
export declare function fs_read(path: string): any;
export declare function fs_readdir(path: string): any;
export declare function fs_isFile(path: string): any;
export declare function fs_exists(path: string): any;
export declare function fs_stat(path: string): any;
export declare type WalkTree = Array<{
    dirpath: string;
    dirnames: string[];
    filenames: string[];
}>;
export declare function os_walk(dirpath: string, stack?: WalkTree): WalkTree;
export declare function path_join(...paths: string[]): any;
export declare class FileStream extends Stream {
    private readonly _path;
    constructor(path: string);
    write(data: Bytes | str): number;
    flush(): void;
}
export declare class Path {
    private _path;
    constructor(p: string);
    static join(...paths: string[]): Path;
    is_file(): any;
    toString(): string;
}
