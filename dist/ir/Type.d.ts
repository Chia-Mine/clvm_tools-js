import { Bytes, int } from "clvm";
export declare class Type {
    static CONS: Type;
    static NULL: Type;
    static INT: Type;
    static HEX: Type;
    static QUOTES: Type;
    static DOUBLE_QUOTE: Type;
    static SINGLE_QUOTE: Type;
    static SYMBOL: Type;
    static OPERATOR: Type;
    static CODE: Type;
    static NODE: Type;
    private readonly _i;
    get i(): number;
    get length(): number;
    get atom(): Bytes;
    constructor(i: int | Type);
    is(other: Type): boolean;
    listp(): boolean;
}
export declare const CONS_TYPES: number[];
