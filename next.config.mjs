import path from "node:path";
import { fileURLToPath } from "node:url";
// Pin the project root so Next ignores stray lockfiles in parent folders (the warning you saw).
export default { turbopack: { root: path.dirname(fileURLToPath(import.meta.url)) } };
