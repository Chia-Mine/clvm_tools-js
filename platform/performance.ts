export function now(){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {performance} = require("perf_hooks");
  return performance.now() / 1000.0;
}
