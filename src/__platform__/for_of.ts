export function for_of<T=unknown, TReturn=any, TNext=unknown>(
  iterator: Generator<T, TReturn, TNext>,
  lambda: (el: T, index: number) => ("stop"|unknown),
){
  let i = 0;
  let next;
  while((next = iterator.next()) && !next.done){
    const op = lambda(next.value, i);
    if(op === "stop"){
      return;
    }
    i++;
  }
}
