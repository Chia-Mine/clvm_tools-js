import {b, Bytes, int, int_from_bytes, int_to_bytes, limbs_for_int} from "clvm";


function i(b: Bytes){
  return int_from_bytes(b);
}

export class Type {
  static CONS = new Type(i(b("CONS")));
  static NULL = new Type(i(b("NULL")));
  static INT = new Type(i(b("INT")));
  static HEX = new Type(i(b("HEX")));
  static QUOTES = new Type(i(b("QT")));
  static DOUBLE_QUOTE = new Type(i(b("DQT")));
  static SINGLE_QUOTE = new Type(i(b("SQT")));
  static SYMBOL = new Type(i(b("SYM")));
  static OPERATOR = new Type(i(b("OP")));
  static CODE = new Type(i(b("CODE")));
  static NODE = new Type(i(b("NODE")));
  
  private readonly _i: number;
  public get i(){
    return this._i;
  }
  
  public get length(){
    return limbs_for_int(this.i);
  }
  
  public get atom(){
    return int_to_bytes(this.i);
  }
  
  public constructor(i: int|Type) {
    if(typeof i === "number"){
      this._i = i;
    }
    else{
      this._i = i.i;
    }
  }
  
  public is(other: Type){
    return this._i === other.i;
  }
  
  public listp(){
    return false;
  }
}

export const CONS_TYPES = [Type.CONS.i];
