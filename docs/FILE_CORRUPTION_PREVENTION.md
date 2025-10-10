# File Corruption Prevention System

This document describes the safeguards implemented to prevent file corruption in the Inkwell codebase.

## Background

During a cleanup operation in October 2025, a Prettier configuration issue caused 100+ TypeScript and TSX files to be corrupted (minified into single-line files). This required extensive emergency recovery work.

## Prevention Measures

### 1. Pre-commit Hook (`/.husky/pre-commit`)

A pre-commit hook runs automatically before every commit to:

- ✅ Run linting and formatting (via `lint-staged`)
- ✅ Detect file corruption (via corruption detection script)
- ✅ Run tests (if available)

**If corruption is detected, the commit is blocked.**

### 2. Corruption Detection Script (`/scripts/check-file-corruption.sh`)

This script scans TypeScript/TSX files for signs of corruption:

- **Minified files**: Files with ≤5 lines but any line >500 characters
- **Empty files**: Files with 0 lines but non-zero file size
- **Suspicious patterns**: Other indicators of file corruption

### 3. Manual Corruption Checking

Run corruption detection manually:

```bash
# Check for corruption in staged files (if in git repo)
pnpm check:corruption

# Or run the script directly
./scripts/check-file-corruption.sh
```

## How It Works

### Detection Criteria

The script flags files as corrupted if they meet suspicious patterns:

1. **Very few lines + very long lines**: ≤5 lines AND any line >500 chars
2. **Empty but not empty**: 0 lines but file has content (byte size > 0)
3. **Exclusions**: Skips `.d.ts` files, test files, and generated files

### Recovery Instructions

If corruption is detected, the script provides recovery commands:

```bash
# Restore from current HEAD
git checkout HEAD -- <corrupted-file>

# Restore from origin/main (recommended)
git checkout origin/main -- <corrupted-file>
```

### Example Output

```
🔍 Checking for corrupted files...
📁 Checking 45 files...
❌ CORRUPTED: src/components/Example.tsx (1 lines, max line: 1247 chars)
❌ CORRUPTED: src/hooks/useExample.ts (1 lines, max line: 892 chars)

🚨 CORRUPTION DETECTED in 2 file(s):
  - src/components/Example.tsx
  - src/hooks/useExample.ts

💡 To fix corrupted files, run:
   git checkout origin/main -- src/components/Example.tsx
   git checkout origin/main -- src/hooks/useExample.ts

❌ Commit blocked due to file corruption
```

## Configuration

### Disable Corruption Checking

To temporarily disable corruption checking (not recommended):

```bash
# Skip pre-commit hooks entirely
git commit --no-verify -m "commit message"
```

### Adjust Detection Thresholds

Edit `/scripts/check-file-corruption.sh` to modify:

- **Line threshold**: Currently ≤5 lines (line 60)
- **Character threshold**: Currently >500 chars per line (line 64)
- **File exclusions**: Test files, .d.ts files, etc. (line 47)

## Integration Points

### CI/CD Pipeline

Consider adding corruption detection to CI:

```yaml
# Example GitHub Actions step
- name: Check for file corruption
  run: pnpm check:corruption
```

### IDE Integration

Some IDEs can run custom scripts on file save. Consider integrating the corruption detector for real-time protection.

## Best Practices

1. **Never bypass** the pre-commit hook unless absolutely necessary
2. **Restore corrupted files immediately** - don't try to manually fix minified code
3. **Test configuration changes** carefully when modifying Prettier, ESLint, or other tools
4. **Run corruption checks** periodically as part of maintenance
5. **Keep backups** via git commits and tags before major changes

## Emergency Recovery

If massive corruption occurs despite these safeguards:

1. **Don't panic** - git history preserves clean versions
2. **Identify scope** using the corruption detection script
3. **Batch restore** from the last known good commit:
   ```bash
   git checkout <good-commit> -- src/
   ```
4. **Commit recovery** with clear documentation
5. **Investigate root cause** and strengthen prevention

## Monitoring

Watch for these warning signs:

- Sudden build failures after formatting operations
- TypeScript errors about "file is not a module"
- Unusually fast Prettier runs (minified files format quickly)
- Large diffs with minimal actual changes

## Related Files

- `/.husky/pre-commit` - Pre-commit hook configuration
- `/scripts/check-file-corruption.sh` - Main detection script
- `/scripts/find-minified.sh` - Original detection script (kept for reference)
- `/package.json` - NPM scripts including `check:corruption`

## Version History

- **v1.0.0** (Oct 2025): Initial implementation after corruption incident
- Protection covers TypeScript/TSX files in `src/` directory
- Integrated with husky pre-commit hooks and lint-staged
