export type TArgOption = {
  action: "store"|"store_true"|"append";
  type: "int"|((v: string) => unknown);
  default: unknown;
  help: string;
  nargs: "*"|"+"|"?"|number;
};

export type Arg = {
  names: string[];
  options: Partial<TArgOption>;
};

function isOptional(arg: string){
  return /^[-]/.test(arg);
}

export type TArgumentParserProps = {
  description: string;
  prog: string;
};

export class ArgumentParser {
  private readonly _prog: string = "prog";
  private _desc: string = "";
  private _positional_args: Arg[] = [];
  private _optional_args: Arg[] = [];
  
  public constructor(props?: Partial<TArgumentParserProps>) {
    if(props){
      if(props.description){
        this._desc = props.description;
      }
      if(props.prog){
        this._prog = props.prog;
      }
    }
  }
  
  public add_argument(argName: string[], options?: Partial<TArgOption>){
    if(argName.length < 1){
      throw new Error("Argument name is missing");
    }
    else if(argName.length === 1 && !isOptional(argName[0])){
      this._positional_args.push({
        names: argName,
        options: options || {},
      });
    }
    else{
      this._optional_args.push({
        names: argName,
        options: options || {},
      });
    }
  }
  
  public parse_args(args: string[]){
    const params: Record<string, unknown> = {};
    
    const getConverter = (type?: "int"|((v: string) => unknown)) => {
      if(!type){ // string
        return (v: string) => v;
      }
      else if(type === "int"){
        return (v: string) => {
          const n = +v;
          if(isNaN(n) || !isFinite(n)){
            const usage = this.compileHelpMessages();
            throw `${usage}\n\nError: Invalid parameter: ${v}`;
          }
          return n;
        };
      }
      else if(typeof type === "function"){
        return type as (v: string) => unknown;
      }
      else{
        const usage = this.compileHelpMessages();
        throw `${usage}\n\nError: Unknown type: ${type}`;
      }
    };
    
    const input_positional_args: string[] = [];
    for(let i=0;i<args.length;i++){
      const arg = args[i];
      // named argument
      if(isOptional(arg)){
        const optional_arg = this._optional_args.find(a => a.names.includes(arg));
        if(!optional_arg){
          const usage = this.compileHelpMessages();
          throw `${usage}\n\nError: Unknown option: ${arg}`;
        }
        
        const name = optional_arg.names[0];
        if(optional_arg.options.action === "store_true"){
          params[name] = true;
          continue;
        }
        
        const converter = getConverter(optional_arg.options.type);
  
        ++i;
        const value = args[i];
        if(!value && !optional_arg.options.default){
          const usage = this.compileHelpMessages();
          throw `${usage}\n\nError: ${name} requires a value`;
        }
        if(!optional_arg.options.action || optional_arg.options.action === "store"){
          params[name] = converter(value) || optional_arg.options.default;
        }
        else if(optional_arg.options.action === "append"){
          const param_value = (params[name] || []) as unknown[];
          params[name] = param_value.concat(converter(value) || optional_arg.options.default);
        }
        else{
          const usage = this.compileHelpMessages();
          throw `${usage}\n\nError: Unknown action: ${optional_arg.options.action}`;
        }
      }
      // positional argument
      else{
        input_positional_args.push(arg);
      }
    }
    
    let i = 0;
    for(let k=0;k<this._positional_args.length;k++){
      const positional_arg_k = this._positional_args[k];
      let input_arg = input_positional_args[i];
  
      const name = positional_arg_k.names[0];
      const nargs = positional_arg_k.options.nargs;
      const converter = getConverter(positional_arg_k.options.type);
  
      if(typeof nargs === "undefined"){
        params[name] = input_arg;
        i++;
      }
      else if(typeof nargs === "number"){
        for(let j=0;j<nargs;j++){
          if(i >= input_positional_args.length){
            const usage = this.compileHelpMessages();
            throw `${usage}\n\nError: Requires ${nargs} positional arguments but got ${i}`;
          }
          input_arg = input_positional_args[i];
          const param_value = (params[name] || []) as unknown[];
          params[name] = param_value.concat(converter(input_arg));
          i++;
        }
      }
      else if(nargs === "?"){
        if(i >= input_positional_args.length){
          if(typeof positional_arg_k.options.default === "undefined"){
            const usage = this.compileHelpMessages();
            throw `${usage}\n\nError: Requires ${nargs} positional arguments but got ${i}`;
          }
          params[name] = positional_arg_k.options.default;
          i++;
        }
        else{
          params[name] = input_arg;
          i++;
        }
      }
      else if(nargs === "*" || nargs === "+"){
        if(i >= input_positional_args.length){
          if(nargs === "+"){
            const usage = this.compileHelpMessages();
            throw `${usage}\n\nError: The following arguments are required: ${name}`;
          }
          params[name] = [];
          i++;
          continue;
        }
        
        for(;i<input_positional_args.length;i++){
          input_arg = input_positional_args[i];
          const param_value = (params[name] || []) as unknown[];
          params[name] = param_value.concat(converter(input_arg));
        }
      }
      else{
        throw `Unknown nargs: ${nargs}. It is a program bug. Contact a developer and report this error.`;
      }
    }
    
    return params;
  }
  
  public compileHelpMessages(){
    const iterator = (a: Arg) => {
      let msg = `${a.names[0]}`;
      if(a.options.help){
        msg += ` ${a.options.help}`;
        msg = msg.replace(/%\(prog\)s/, this._prog);
        msg = msg.replace(/%\(default\)s/, (a.options.default as string) || "");
      }
      return msg;
    };
    
    const messages = [
      `usage: ${this._prog} ` + this._optional_args.concat(this._positional_args).map(a => `[${a.names[0]}]`).join(" "),
      "",
      "positional arguments:",
      ...this._positional_args.map(iterator),
      "",
      ...this._optional_args.map(iterator),
    ];
    
    return messages.join("\n");
  }
}
