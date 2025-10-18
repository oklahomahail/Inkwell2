import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const projectRoot = path.resolve(process.cwd());
const readmePath = path.join(projectRoot, "README.md");

function generateTree() {
  try {
    // Generate a simple sample tree structure
    return `src/
  components/
  features/
  hooks/
  services/
  utils/
  styles/
  types/
docs/
  dev/
  ops/
  product/`.trim();
  } catch {
    return "Error generating tree. Run `pnpm add -D tree-cli` and retry.";
  }
}

function updateReadme() {
  const tree = generateTree();
  let readme = fs.readFileSync(readmePath, "utf8");

  const start = "<!-- TREE:BEGIN -->";
  const end = "<!-- TREE:END -->";
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, "m");

  const replacement = `${start}\n\`\`\`\n${tree}\n\`\`\`\n${end}`;
  const newReadme = readme.replace(pattern, replacement);

  fs.writeFileSync(readmePath, newReadme, "utf8");
  console.log("✅ Project tree updated in README.md");
}

updateReadme();