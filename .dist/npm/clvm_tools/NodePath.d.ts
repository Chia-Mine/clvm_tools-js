import { int } from "clvm";
export declare function compose_paths(path_0: int, path_1: int): number;
export declare class NodePath {
    private _index;
    as_path: () => import("clvm").Bytes;
    get index(): number;
    constructor(index?: int);
    as_short_path(): import("clvm").Bytes;
    add(other_node: NodePath): NodePath;
    first(): NodePath;
    rest(): NodePath;
    toString(): string;
    __repl__(): string;
}
export declare const TOP: NodePath;
export declare const LEFT: NodePath;
export declare const RIGHT: NodePath;
