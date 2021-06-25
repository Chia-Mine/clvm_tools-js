export function now(){
  const {performance} = require("perf_hooks");
  return performance.now();
}
