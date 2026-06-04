const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const {
  installSkill,
  getSkillStatus,
  runSystemAgentScan,
} = require('../utils/agent-skill');

const PKG_DIR = path.join(__dirname, '..');
const CLI_PATH = path.join(PKG_DIR, 'index.js');
const TEST_HOME = path.join(PKG_DIR, 'tmp', 'test-skill-home');
const TEST_PROJECT = path.join(PKG_DIR, 'tmp', 'test-skill-project');
const SKILL_NAME = 'youtrack-app-builder';
const METADATA_FILENAME = `${SKILL_NAME}.youtrack-skill-install.json`;

function runCLI(args) {
  try {
    const output = execFileSync('node', [CLI_PATH, ...args], {
      cwd: PKG_DIR,
      encoding: 'utf8',
      env: {
        ...process.env,
        YOUTRACK_SKILL_HOME: TEST_HOME,
        NO_COLOR: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: `${error.stdout || ''}${error.stderr || ''}`,
      error,
    };
  }
}

function agentConfigDir(agent) {
  return agent === 'codex' ? '.codex' : '.claude';
}

function targetDir(agent, scope = 'global') {
  const root = scope === 'global' ? TEST_HOME : TEST_PROJECT;
  return path.join(root, agentConfigDir(agent), 'skills', SKILL_NAME);
}

function metadata(agent, scope = 'global') {
  return JSON.parse(
    fs.readFileSync(path.join(path.dirname(targetDir(agent, scope)), METADATA_FILENAME), 'utf8')
  );
}

describe('Agent skill CLI', () => {
  beforeEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
    fs.rmSync(TEST_PROJECT, { recursive: true, force: true });
    fs.mkdirSync(TEST_PROJECT, { recursive: true });
    fs.writeFileSync(path.join(TEST_PROJECT, 'package.json'), '{"name":"test-project"}\n');
  });

  afterEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
    fs.rmSync(TEST_PROJECT, { recursive: true, force: true });
  });

  test('skill install defaults to global symlinks for Claude and Codex in non-interactive mode', () => {
    const result = runCLI(['skill', 'install']);

    assert.strictEqual(result.success, true, result.output);
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex'), 'SKILL.md')), true);
    assert.strictEqual(fs.existsSync(path.join(targetDir('claude'), 'SKILL.md')), true);
    assert.strictEqual(fs.lstatSync(targetDir('codex')).isSymbolicLink(), true);
    assert.strictEqual(fs.lstatSync(targetDir('claude')).isSymbolicLink(), true);
    assert.strictEqual(metadata('codex').targetAgent, 'codex');
    assert.strictEqual(metadata('claude').targetAgent, 'claude');
    assert.strictEqual(metadata('codex').deploymentType, 'symlink');
  });

  test('project-level install uses hard copies', () => {
    const results = installSkill({
      agent: 'codex',
      scope: 'project',
      cwd: TEST_PROJECT,
      homeDir: TEST_HOME,
    });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].deploymentType, 'copy');
    assert.strictEqual(fs.existsSync(path.join(targetDir('codex', 'project'), 'SKILL.md')), true);
    assert.strictEqual(fs.lstatSync(targetDir('codex', 'project')).isSymbolicLink(), false);
    assert.strictEqual(metadata('codex', 'project').scope, 'project');
  });

  test('status reports installed and not installed based on target directories', () => {
    installSkill({
      agent: 'codex',
      scope: 'global',
      homeDir: TEST_HOME,
    });

    const statuses = getSkillStatus({
      agent: 'both',
      scope: 'global',
      homeDir: TEST_HOME,
      cwd: TEST_PROJECT,
    });

    const codex = statuses.find(status => status.agent === 'codex');
    const claude = statuses.find(status => status.agent === 'claude');

    assert.strictEqual(codex.installed, true);
    assert.strictEqual(codex.isSymlink, true);
    assert.strictEqual(claude.installed, false);
  });

  test('agent discovery scans only supported agents', () => {
    const results = runSystemAgentScan({
      homeDir: TEST_HOME,
      cwd: TEST_PROJECT,
      env: { PATH: process.env.PATH || '' },
    });

    assert.deepStrictEqual(results.map(result => result.agent).sort(), ['claude', 'codex']);
    assert.strictEqual(results.every(result => result.projectAvailable), true);
  });

  test('invalid skill command fails with a clear error', () => {
    const result = runCLI(['skill', 'discover']);

    assert.strictEqual(result.success, false, 'Command should fail');
    assert.match(result.output, /Invalid skill command: "discover"/);
    assert.match(result.output, /install, status/);
  });
});
