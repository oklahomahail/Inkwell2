#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const GLOB_DIRS = ['src']; // edit if needed
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'build', 'scripts', '__mocks__']);
const EXCLUDE_FILE_RE = /\.(test|spec)\.(t|j)sx?$/;

const FILE_RE = /\.[tj]sx?$/;
const IMPORT_RE = /from\s+["']src\/utils\/devLogger["'];?/;
const HAS_CONSOLE_LOG_RE = /(^|[^A-Za-z0-9_])console\.log\s*\(/;
const LINE_COMMENT_RE = /^\s*\/\//;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.has(name)) walk(p, files);
    } else if (FILE_RE.test(name) && !EXCLUDE_FILE_RE.test(name)) {
      files.push(p);
    }
  }
  return files;
}

function injectImport(code) {
  if (IMPORT_RE.test(code)) return code;
  const firstImportIdx = code.search(/^\s*import\s/m);
  const imp = `import devLog from "src/utils/devLogger";\n`;
  if (firstImportIdx === -1) return imp + code;
  return code.slice(0, firstImportIdx) + imp + code.slice(firstImportIdx);
}

function transformFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!HAS_CONSOLE_LOG_RE.test(code)) return { changed: false };

  const lines = code.split('\n');
  let inBlockComment = false;
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // crude block comment tracking
    if (line.includes('/*')) inBlockComment = true;
    if (inBlockComment && line.includes('*/')) {
      inBlockComment = false;
      continue;
    }
    if (inBlockComment || LINE_COMMENT_RE.test(line)) continue;

    // ignore obvious string-only lines
    const quoteCount = (line.match(/["'`]/g) || []).length;
    if (
      quoteCount >= 2 &&
      (line.trim().startsWith("'") || line.trim().startsWith('"') || line.trim().startsWith('`'))
    ) {
      // very naive: skip single-line string literals
      continue;
    }

    if (HAS_CONSOLE_LOG_RE.test(line)) {
      // replace console.log( → devLog.debug(
      line = line.replace(/(^|[^A-Za-z0-9_])console\.log\s*\(/g, (_, pre) => `${pre}devLog.debug(`);
      lines[i] = line;
      changed = true;
    }
  }

  if (!changed) return { changed: false };

  code = lines.join('\n');
  code = injectImport(code);
  fs.writeFileSync(file, code, 'utf8');
  return { changed: true };
}

function run() {
  let count = 0;
  for (const dir of GLOB_DIRS) {
    const base = path.join(ROOT, dir);
    if (!fs.existsSync(base)) continue;
    for (const f of walk(base)) {
      const res = transformFile(f);
      if (res.changed) count++;
    }
  }
  console.log(`✅ Replaced console.log in ${count} files.`);
}

run();
