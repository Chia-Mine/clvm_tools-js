import {SHA256} from "jscrypto";
import {Atom, Bytes, isCons, SExp} from "clvm";

export function sha256tree(v: SExp): Bytes {
  let s;
  if(isCons(v)){
    const left = sha256tree(v.pair[0]);
    const right = sha256tree(v.pair[1]);
    s = Bytes.from("0x02", "hex").concat(left).concat(right);
  }
  else{
    s = Bytes.from("0x01", "hex").concat((v as Atom).atom);
  }
  
  const hashedWords = SHA256.hash(s.as_word());
  return Bytes.from(hashedWords);
}
