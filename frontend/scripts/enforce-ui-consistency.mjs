import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src", "components");
const BASELINE_PATH = path.resolve(process.cwd(), "scripts", "ui-consistency-baseline.json");

const TARGETS = [
  "NodeCanvas.jsx",
  "MobileCanvas.jsx",
  "IntegrationPanel.jsx",
  "LiveDashboard.jsx",
];

const RULES = {
  inlineStyles: /style=\{\{/g,
  imperativeHover: /onMouseEnter=|onMouseLeave=/g,
  rawControls: /<(button|input|select|textarea)\b/g,
  nonTokenTransition: /transition:\s*["'`](?!var\(--motion-transition-(interactive|layout)\))[^"'`]+["'`]/g,
  nonTokenShadow: /boxShadow:\s*["'`](?!var\(--(ui-elevation|elevation|shadow))[^"'`]+["'`]/g,
};

function countMatches(source, regex) {
  const matches = source.match(regex);
  return matches ? matches.length : 0;
}

function buildCurrent() {
  const current = {};
  for (const file of TARGETS) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const source = fs.readFileSync(fullPath, "utf8");
    current[file] = {
      inlineStyles: countMatches(source, RULES.inlineStyles),
      imperativeHover: countMatches(source, RULES.imperativeHover),
      rawControls: countMatches(source, RULES.rawControls),
    };
  }
  return current;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Missing baseline file: ${BASELINE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
}

const baseline = loadBaseline();
const current = buildCurrent();
const violations = [];

for (const [file, counts] of Object.entries(current)) {
  const base = baseline[file];
  if (!base) {
    violations.push(`${file}: missing baseline entry`);
    continue;
  }
  for (const key of Object.keys(RULES)) {
    if (base[key] === undefined) continue;
    if ((counts[key] ?? 0) > base[key]) {
      violations.push(
        `${file}: ${key} increased ${base[key]} -> ${counts[key]}`
      );
    }
  }
}

if (violations.length) {
  console.error("UI consistency enforcement failed:");
  for (const v of violations) console.error(` - ${v}`);
  process.exit(1);
}

console.log("UI consistency enforcement passed (no regression vs baseline).");
