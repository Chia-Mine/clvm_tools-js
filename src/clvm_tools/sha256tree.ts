import {SHA256} from "jscrypto";
import {h, Atom, Bytes, isCons, SExp} from "clvm";

export function sha256tree(v: SExp): Bytes {
  let s;
  if(isCons(v)){
    const left = sha256tree(v.pair[0]);
    const right = sha256tree(v.pair[1]);
    s = h("0x02").concat(left).concat(right);
  }
  else{
    s = h("0x01").concat((v as Atom).atom);
  }
  
  const hashedWords = SHA256.hash(s.as_word());
  return Bytes.from(hashedWords);
}
