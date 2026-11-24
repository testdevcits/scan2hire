const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../src");
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name) && !file.includes(`${path.sep}api${path.sep}`) && !file.endsWith("ApiContext.js") && !file.endsWith("AuthContext.js") && !file.includes(`${path.sep}contexts${path.sep}Hr${path.sep}`)) files.push(file);
  }
}
walk(root);

for (const file of files) {
  let source = fs.readFileSync(file, "utf8");
  const imports = [];
  source = source.replace(/^import\s+\{([^}]+)\}\s+from\s+["'][^"']*\/api["'];?\s*$/gm, (_, names) => {
    names.split(",").map((name) => name.trim()).filter(Boolean).forEach((name) => imports.push(name));
    return "";
  });
  source = source.replace(/^import\s+API\s+from\s+["'][^"']*\/api\/axios["'];?\s*$/gm, () => {
    imports.push("API");
    return "";
  });
  if (!imports.length) continue;
  const unique = [...new Set(imports)];
  const contextPath = `./${path.relative(path.dirname(file), path.join(root, "contexts/ApiContext")).replace(/\\/g, "/")}`.replace("./../", "../");
  source = `import { useApi } from "${contextPath}";\n${source}`;
  const component = source.match(/(?:export\s+default\s+)?(?:function\s+([A-Z][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{|const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\([^)]*\)\s*=>\s*\{)/);
  if (!component) {
    console.warn(`Skipped ${file}: no component function found`);
    continue;
  }
  const at = component.index + component[0].length;
  source = `${source.slice(0, at)}\n  const { ${unique.join(", ")} } = useApi();${source.slice(at)}`;
  fs.writeFileSync(file, source);
  console.log(path.relative(root, file));
}
