export function for_of<T=unknown, TReturn=any, TNext=unknown>(
  iterator: Generator<T, TReturn, TNext>,
  lambda: (el: T, index: number) => ("stop"|void),
){
  let i = 0;
  let next;
  while((next = iterator.next()) && !next.done){
    const op = lambda(next.value, i);
    if(op === "stop"){
      return true;
    }
    i++;
  }
  // Returns true if at least loop is executed once.
  return Boolean(i);
}
