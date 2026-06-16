import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readContractFixture<T>(fixturePath: string): T {
  const absolutePath = resolve(
    process.cwd(),
    "..",
    "docs",
    "original-development-docs",
    "contracts",
    "fixtures",
    fixturePath,
  );
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}
