export declare type TArgOption = {
    action: "store" | "store_true" | "append";
    type: "str" | "int" | ((v: string) => unknown);
    default: unknown;
    help: string;
    nargs: "*" | "+" | "?" | number;
};
export declare type Arg = {
    names: string[];
    options: Partial<TArgOption>;
};
export declare type TArgumentParserProps = {
    description: string;
    prog: string;
};
export declare class ArgumentParser {
    private readonly _prog;
    private _desc;
    private _positional_args;
    private _optional_args;
    constructor(props?: Partial<TArgumentParserProps>);
    protected _getConverter(type?: "str" | "int" | ((v: string) => unknown)): (v: string) => unknown;
    protected _getOptionalArgName(arg: Arg): string;
    add_argument(argName: string[], options?: Partial<TArgOption>): void;
    parse_args(args: string[]): Record<string, unknown>;
    compileHelpMessages(): string;
    /**
     * Separate short form argument which doesn't have space character between name and value.
     * For example, turn:
     *   "-x1" => ["-x", "1"]
     *   "-x 1" => ["-x", "1"]
     *   "-xxxxx" => ["-x", "xxxx"]
     * @param args - arguments passed
     */
    normalizeArgs(args: string[]): string[];
}
