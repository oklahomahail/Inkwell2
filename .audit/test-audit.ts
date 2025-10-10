import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

type CovSummary = {
  total: Record<string, { total: number; covered: number; skipped?: number; pct: number }>;
  [file: string]: any;
};

const AUDIT_DIR = '.audit';
const BASELINE_PATH = join(AUDIT_DIR, 'coverage-baseline.json');
const CURRENT_PATH = join(AUDIT_DIR, 'coverage-current.json');

function run(cmd: string) {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e: any) {
    // Continue even if tests fail - we just need the coverage report
    if (e.status !== 1) throw e;
  }
}

function readJson<T = any>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function writeJson(p: string, data: any) {
  mkdirSync(AUDIT_DIR, { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2));
}

function vitestWithCoverage(outPath: string) {
  // Run Vitest with coverage and capture summary
  run(`pnpm vitest --run --coverage --coverage.reporter=json-summary`);
  const summaryPath = 'coverage/coverage-summary.json';
  try {
    if (!existsSync(summaryPath)) {
      throw new Error('coverage/coverage-summary.json not found. Is coverage enabled?');
    }
    const cov = readJson<CovSummary>(summaryPath);
    writeJson(outPath, cov);
  } catch (e) {
    console.error('Failed to process coverage report:', e);
    throw e;
  }
}

function listFromEnvOrArgs(): string[] {
  // Accept comma-separated list after --skipFiles (e.g., pnpm audit:probe:files -- --skipFiles="src/foo.test.ts,src/bar.test.tsx")
  const idx = process.argv.findIndex((a) => a === '--skipFiles');
  if (idx >= 0) {
    const next = process.argv[idx + 1] || '';
    return next
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const env = process.env.SKIP_TESTS ?? '';
  return env
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toSkipName(path: string) {
  const ext = extname(path); // .ts | .tsx | .js
  return path.replace(new RegExp(`${ext}$`), `.skip${ext}`);
}

function compareCoverage(baseline: CovSummary, current: CovSummary) {
  // Compare top-level totals, then per-file if you want to extend.
  const keys = ['lines', 'statements', 'branches', 'functions'] as const;
  const deltas = {} as Record<(typeof keys)[number], number>;
  for (const k of keys) {
    const base = baseline.total?.[k]?.covered ?? 0;
    const cur = current.total?.[k]?.covered ?? 0;
    deltas[k] = cur - base;
  }
  return deltas;
}

function printDeltas(deltas: Record<string, number>) {
  console.log('\nCoverage delta (current - baseline):');
  for (const [k, v] of Object.entries(deltas)) {
    const sign = v === 0 ? '' : v > 0 ? '+' : '';
    console.log(`  ${k.padEnd(10)} ${sign}${v}`);
  }
}

function main() {
  const mode = process.argv[2];

  if (mode === 'baseline') {
    console.log('Creating coverage baseline…');
    vitestWithCoverage(BASELINE_PATH);
    console.log(`Baseline written to ${BASELINE_PATH}`);
    return;
  }

  if (mode === 'probe') {
    if (!existsSync(BASELINE_PATH)) {
      console.error(`Baseline not found at ${BASELINE_PATH}. Run: pnpm audit:baseline`);
      process.exit(1);
    }
    const skipFiles = listFromEnvOrArgs();

    // Rename selected test files to .skip*
    const renames: Array<{ from: string; to: string }> = [];
    try {
      if (skipFiles.length) {
        console.log('\nTemporarily skipping files:');
        for (const f of skipFiles) {
          const tgt = toSkipName(f);
          console.log(`  ${f} -> ${tgt}`);
          renameSync(f, tgt);
          renames.push({ from: f, to: tgt });
        }
      } else {
        console.log('No --skipFiles provided. Running probe without exclusions.');
      }

      vitestWithCoverage(CURRENT_PATH);

      const baseline = readJson<CovSummary>(BASELINE_PATH);
      const current = readJson<CovSummary>(CURRENT_PATH);
      const deltas = compareCoverage(baseline, current);
      printDeltas(deltas);

      const safeToDelete = Object.values(deltas).every((d) => d === 0) && skipFiles.length > 0;

      console.log('\nResult:');
      if (safeToDelete) {
        console.log(
          '  ✅ No coverage loss detected. The skipped files are candidates for deletion or consolidation:',
        );
        skipFiles.forEach((f) => console.log(`    - ${f}`));
      } else {
        console.log(
          '  ⚠️  Coverage changed. Review the skipped files; at least one adds unique coverage.',
        );
      }
    } finally {
      // Restore files
      for (const { from, to } of renames) {
        try {
          renameSync(to, from);
        } catch (e) {
          console.error(`Failed to restore ${to} -> ${from}:`, e);
        }
      }
    }
    return;
  }

  if (mode === 'clean') {
    // Remove current snapshot so next probe is fresh
    if (existsSync(CURRENT_PATH)) {
      writeJson(CURRENT_PATH, {});
      console.log(`Cleaned ${CURRENT_PATH}`);
    } else {
      console.log('Nothing to clean.');
    }
    return;
  }

  console.log(`Unknown mode '${mode}'. Use one of: baseline | probe | clean`);
  process.exit(1);
}

main();
