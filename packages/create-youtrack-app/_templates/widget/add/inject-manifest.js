const fs = require("node:fs");
const path = require("node:path");

function injectWidget(newWidget, cwd) {
  const fileName = "manifest.json";
  // path.resolve handles both absolute cwd (tests/CI) and relative cwd (npm scripts)
  const filePath = path.resolve(process.cwd(), cwd || '', fileName);
  const targetCwd = path.dirname(filePath);

  const manifest = readJsonFile(filePath, 'manifest.json');

  if (!Array.isArray(manifest.widgets)) {
    manifest.widgets = [];
  }

  if (manifest.widgets.some(w => w.key === newWidget.key)) {
    throw new Error(`Widget with key "${newWidget.key}" already exists in manifest.json`);
  }

  manifest.widgets.push(newWidget);

  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
  syncViteWidgetInputs(targetCwd, manifest.widgets);
  syncViteStaticCopyTargets(targetCwd);
}

function readJsonFile(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    const hint = error && error.message && error.message.includes('Expected double-quoted')
      ? ' Check for a trailing comma or an unquoted property name.'
      : '';
    throw new Error(`Could not parse ${label}: ${(error && error.message) || String(error)}.${hint}`);
  }
}

function syncViteWidgetInputs(targetCwd, widgets) {
  const packageJsonPath = path.join(targetCwd, 'package.json');
  const viteConfigPath = path.join(targetCwd, 'vite.config.ts');

  if (!fs.existsSync(viteConfigPath) || isEnhancedDxProject(packageJsonPath)) {
    return;
  }

  const content = fs.readFileSync(viteConfigPath, 'utf8');
  if (content.includes('getWidgetInputs()')) {
    return;
  }

  const marker = '// List every widget entry point here';
  const lines = content.split('\n');
  const markerIndex = lines.findIndex(line => line.includes(marker));
  if (markerIndex === -1) {
    return;
  }

  const indent = lines[markerIndex].match(/^\s*/)[0];
  let endIndex = markerIndex + 1;
  while (endIndex < lines.length && isGeneratedWidgetInputLine(lines[endIndex])) {
    endIndex++;
  }

  const inputLines = widgets
    .filter(widget => widget.key && widget.indexPath)
    .map(widget => `${indent}${toInputName(widget.key)}: resolve(__dirname, 'src/widgets/${widget.indexPath}'),`);

  lines.splice(markerIndex + 1, endIndex - markerIndex - 1, ...inputLines);
  fs.writeFileSync(viteConfigPath, lines.join('\n'));
}

function syncViteStaticCopyTargets(targetCwd) {
  const packageJsonPath = path.join(targetCwd, 'package.json');
  const viteConfigPath = path.join(targetCwd, 'vite.config.ts');

  if (!fs.existsSync(viteConfigPath) || isEnhancedDxProject(packageJsonPath)) {
    return;
  }

  const content = fs.readFileSync(viteConfigPath, 'utf8');
  if (content.includes('getStaticCopyTargets()')) {
    return;
  }

  const nextContent = [
    hasTopLevelFiles(path.join(targetCwd, 'src')) ? null : 'src',
    hasTopLevelFiles(path.join(targetCwd, 'public')) ? null : 'public',
  ].filter(Boolean).reduce(
    (current, targetName) => removeStaticCopyTarget(current, targetName),
    content
  );

  if (nextContent !== content) {
    fs.writeFileSync(viteConfigPath, nextContent);
  }
}

function removeStaticCopyTarget(content, targetName) {
  const srcPattern = targetName === 'src'
    ? String.raw`\*\.\*`
    : String.raw`\.\.\/public\/\*\.\*`;
  const targetPattern = new RegExp(
    String.raw`\n\s*\{\s*\n\s*src:\s*['"]${srcPattern}['"],\s*\n\s*dest:\s*['"]\.['"]\s*\n\s*\},?`,
    'g'
  );

  return content.replace(targetPattern, '');
}

function isEnhancedDxProject(packageJsonPath) {
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return pkg.enhancedDX === true || pkg.enhancedDX === 'true';
  } catch {
    return false;
  }
}

function isGeneratedWidgetInputLine(line) {
  return /^\s*$/.test(line) ||
    /^\s*[A-Za-z_$][\w$]*:\s*resolve\(__dirname,\s*['"]src\/widgets\/[^'"]+['"]\),?\s*$/.test(line);
}

function toInputName(key) {
  return key
    .replace(/-([a-z0-9])/g, (_, value) => value.toUpperCase())
    .replace(/[^a-zA-Z0-9_$]/g, '_');
}

function hasTopLevelFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).some(dirent => dirent.isFile());
}

module.exports.injectWidget = injectWidget;
module.exports.syncViteWidgetInputs = syncViteWidgetInputs;
module.exports.syncViteStaticCopyTargets = syncViteStaticCopyTargets;
