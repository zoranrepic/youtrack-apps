---
to: scripts/build.cjs
---
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const root = process.cwd();
const dist = path.join(root, 'dist');

const manifest = readJson(path.join(root, 'manifest.json'));
const widgets = Array.isArray(manifest.widgets) ? manifest.widgets : [];
const hasWidgets = widgets.length > 0;

if (hasWidgets) {
  buildWidgets();
} else {
  resetDist();
}

writeManifest(hasWidgets ? manifest : withoutWidgets(manifest));
copyPublicAssets();
copyRootBackendFiles();
copyWorkflowRules();

function buildWidgets() {
  run('tsc -p tsconfig.app.json');
  run('vite build');
}

function resetDist() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
}

function writeManifest(value) {
  writeJson(path.join(dist, 'manifest.json'), value);
}

function withoutWidgets(value) {
  const cleanManifest = { ...value };
  delete cleanManifest.widgets;
  return cleanManifest;
}

function copyPublicAssets() {
  copyDirectory(path.join(root, 'public'), dist);
}

function copyRootBackendFiles() {
  copyTopLevelFiles(path.join(root, 'src'), dist, fileName => (
    fileName.endsWith('.js') ||
    fileName === 'settings.json' ||
    fileName === 'entity-extensions.json'
  ));
}

function copyWorkflowRules() {
  copyTopLevelFiles(
    path.join(root, 'src', 'backend', 'workflows'),
    dist,
    fileName => fileName.endsWith('.js')
  );
}

function copyDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  for (const dirent of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, dirent.name);
    const targetPath = path.join(targetDir, dirent.name);

    if (dirent.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (dirent.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
}

function copyTopLevelFiles(sourceDir, targetDir, filter) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  for (const dirent of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (dirent.isFile() && filter(dirent.name)) {
      copyFile(path.join(sourceDir, dirent.name), path.join(targetDir, dirent.name));
    }
  }
}

function copyFile(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (arguments.length === 2) {
      return fallback;
    }
    throw new Error(`${path.relative(root, filePath)} not found`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(targetPath, value) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

function run(command) {
  execSync(command, { cwd: root, stdio: 'inherit' });
}
