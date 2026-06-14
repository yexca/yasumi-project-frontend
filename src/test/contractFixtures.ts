import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readContractFixture<T>(fixturePath: string): T {
  const absolutePath = resolve(
    process.cwd(),
    "..",
    "dev_documents",
    "contracts",
    "fixtures",
    fixturePath,
  );
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}
