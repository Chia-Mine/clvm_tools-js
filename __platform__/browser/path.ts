export function resolve(...paths: string[]): string {
  return paths.join("/")
    .replace(/[?+*\[\]\\><]/g, "")
    .replace(/[/]+/g, "/")
    .replace(/[/]$/, "")
    ;
}