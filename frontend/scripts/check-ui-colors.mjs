import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "src", "components");
const TARGET_FILES = [
  "NodeCanvas.jsx",
  "Dashboard.jsx",
  "AdminPanel.jsx",
  "IntegrationPanel.jsx",
  "LiveDashboard.jsx",
];

const ALLOWED_PATTERNS = [
  /var\(--/i,
  /transparent/i,
  /currentColor/i,
  /inherit/i,
];

const FORBIDDEN_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

function isAllowedLiteral(literal) {
  return ALLOWED_PATTERNS.some((re) => re.test(literal));
}

let violations = [];

for (const file of TARGET_FILES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;
  const source = fs.readFileSync(fullPath, "utf8");
  const lines = source.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const matches = line.match(FORBIDDEN_COLOR_RE) || [];
    for (const match of matches) {
      if (!isAllowedLiteral(match)) {
        violations.push(`${file}:${idx + 1} -> ${match}`);
      }
    }
  });
}

if (violations.length) {
  console.warn("Found hardcoded UI color literals in core components:");
  for (const v of violations) console.warn(` - ${v}`);
  console.warn("Please migrate these to semantic skin tokens.");
  process.exit(0);
}

console.log("No hardcoded UI color literals found in guarded components.");
