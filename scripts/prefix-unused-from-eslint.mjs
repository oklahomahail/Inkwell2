import fs from "fs";
import path from "path";
import MagicString from "magic-string";

/**
 * Usage:
 *  1) pnpm eslint "src/**/*.{ts,tsx}" -f json -o eslint-report.json
 *  2) node scripts/prefix-unused-from-eslint.mjs eslint-report.json
 */

const REPORT = process.argv[2] || "eslint-report.json";
const UNUSED_RULES = new Set([
  "@typescript-eslint/no-unused-vars",
  "no-unused-vars"
]);

const fileCache = new Map();

function loadFile(file) {
  if (!fileCache.has(file)) {
    const code = fs.readFileSync(file, "utf8");
    fileCache.set(file, { code, ms: new MagicString(code) });
  }
  return fileCache.get(file);
}

function applyFix(file, msg) {
  // ESLint provides "line" and "column" (1-based).
  const { line, column } = msg;
  const { code, ms } = loadFile(file);

  const lines = code.split("\n");
  const targetLine = lines[line - 1] || "";
  // naive identifier grab from the reported column position
  const startIdx = column - 1;
  const idMatch = /[A-Za-z_$][A-Za-z0-9_$]*/g;
  idMatch.lastIndex = startIdx;
  const m1 = idMatch.exec(targetLine) || (() => {
    // try scanning backwards if cursor is on a space/comma
    idMatch.lastIndex = 0;
    let found = null;
    for (const m of targetLine.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
      if (m.index <= startIdx && m.index + m[0].length >= startIdx - 1) { found = m; }
    }
    return found;
  })();

  if (!m1) return false;
  const id = m1[0];
  if (id.startsWith("_")) return false;

  // Compute absolute offsets for MagicString
  const prior = lines.slice(0, line - 1).join("\n").length + (line > 1 ? 1 : 0);
  const absStart = prior + m1.index;
  ms.prependLeft(absStart, "_");
  return true;
}

function main() {
  if (!fs.existsSync(REPORT)) {
    console.error(`Error: ${REPORT} not found. Run ESLint first to generate it.`);
    process.exit(1);
  }

  const json = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  let changes = 0;

  for (const f of json) {
    const file = f.filePath;
    for (const m of f.messages) {
      if (!UNUSED_RULES.has(m.ruleId)) continue;
      // Skip generated or declaration files
      if (file.endsWith(".d.ts")) continue;
      // Only touch obvious cases: variables/params, not TypeScript types
      if (/'^_/.test(m.message)) continue;
      const ok = applyFix(file, m);
      if (ok) changes++;
    }
  }

  for (const [file, { ms }] of fileCache) {
    fs.writeFileSync(file, ms.toString(), "utf8");
  }
  console.log(`✅ Prefixed ${changes} unused identifiers with "_"`);
}

main();
