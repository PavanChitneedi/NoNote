import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src", "components");
const EXCLUDE = new Set([
  "ui/uiPrimitivesV2.jsx",
  "ui/primitives.jsx",
]);

const RULES = {
  inlineStyles: /style=\{\{/g,
  nonTokenTransition: /transition:\s*["'`](?!var\(--motion-transition-(interactive|layout)\))[^"'`]+["'`]/g,
  nonTokenShadow: /boxShadow:\s*["'`](?!var\(--(ui-elevation|elevation|shadow))[^"'`]+["'`]/g,
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function countMatches(source, regex) {
  const matches = source.match(regex);
  return matches ? matches.length : 0;
}

const files = walk(ROOT);
const warnings = [];

for (const filePath of files) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (EXCLUDE.has(rel)) continue;
  const source = fs.readFileSync(filePath, "utf8");
  const counts = Object.fromEntries(
    Object.entries(RULES).map(([key, regex]) => [key, countMatches(source, regex)])
  );
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) continue;
  warnings.push(`${rel}: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(", ")}`);
}

if (!warnings.length) {
  console.log("UI usage warnings: none");
  process.exit(0);
}

console.warn("UI usage warnings (migrate toward primitives/tokens):");
for (const w of warnings) console.warn(` - ${w}`);
console.warn("Rule: Only primitives define styles; avoid inline style and non-token motion/elevation.");
