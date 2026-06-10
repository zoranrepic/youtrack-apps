const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SKILL_NAME = 'youtrack-app-builder';
const PACKAGE_NAME = '@jetbrains/create-youtrack-app';
const METADATA_FILENAME = '.youtrack-skill-install.json';

const ALL_AGENTS = 'all';
const ALL_SCOPES = 'all';
const GLOBAL_SCOPE = 'global';
const PROJECT_SCOPE = 'project';
const DEFAULT_AGENT_SELECTION = ALL_AGENTS;
const DEFAULT_INSTALL_SCOPE = GLOBAL_SCOPE;

const SUPPORTED_AGENTS = [
  {
    id: 'claude',
    displayName: 'Claude Code',
    configDir: '.claude',
    binary: 'claude',
  },
  {
    id: 'codex',
    displayName: 'Codex CLI',
    configDir: '.codex',
    binary: 'codex',
  },
  {
    id: 'junie',
    displayName: 'Junie',
    configDir: '.junie',
    binary: 'junie',
  },
];

const SUPPORTED_AGENT_BY_ID = Object.fromEntries(
  SUPPORTED_AGENTS.map(agent => [agent.id, agent])
);
const SUPPORTED_AGENT_IDS = SUPPORTED_AGENTS.map(agent => agent.id);
const VALID_AGENT_VALUES = [...SUPPORTED_AGENT_IDS, ALL_AGENTS];
const VALID_SCOPE_VALUES = [GLOBAL_SCOPE, PROJECT_SCOPE];
const VALID_SCOPE_INPUT_VALUES = [...VALID_SCOPE_VALUES, ALL_SCOPES];
const DEPLOYMENT_BY_SCOPE = {
  [GLOBAL_SCOPE]: 'symlink',
  [PROJECT_SCOPE]: 'copy',
};

function getSkillSourceDir() {
  return path.join(__dirname, '..', 'resources', 'skills', SKILL_NAME);
}

function getHomeDir() {
  return process.env.YOUTRACK_SKILL_HOME || os.homedir();
}

function getPackageVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return pkg.version;
}

function normalizeSlashes(value) {
  return String(value).replace(/\\/g, '/');
}

function assertSupportedAgent(agentId) {
  if (!SUPPORTED_AGENT_BY_ID[agentId]) {
    throw new Error(`Invalid agent: "${agentId}". Must be one of: ${VALID_AGENT_VALUES.join(', ')}.`);
  }
}

function expandAgents(agentInput = DEFAULT_AGENT_SELECTION) {
  const requestedAgents = String(agentInput || DEFAULT_AGENT_SELECTION)
    .split(',')
    .map(agent => agent.trim().toLowerCase())
    .filter(Boolean);
  const expandedAgents = [];

  for (const agentId of requestedAgents) {
    if (agentId === ALL_AGENTS) {
      expandedAgents.push(...SUPPORTED_AGENT_IDS);
      continue;
    }

    assertSupportedAgent(agentId);
    expandedAgents.push(agentId);
  }

  return [...new Set(expandedAgents)];
}

function expandScopes(scopeInput = DEFAULT_INSTALL_SCOPE) {
  const scope = String(scopeInput || DEFAULT_INSTALL_SCOPE).toLowerCase();

  if (!VALID_SCOPE_INPUT_VALUES.includes(scope)) {
    throw new Error(`Invalid skill scope: "${scopeInput}". Must be one of: ${VALID_SCOPE_INPUT_VALUES.join(', ')}.`);
  }

  return scope === ALL_SCOPES ? [...VALID_SCOPE_VALUES] : [scope];
}

function findProjectRoot(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const looksLikeRepository = fs.existsSync(path.join(currentDir, '.git'));
    const looksLikeNodeProject = fs.existsSync(path.join(currentDir, 'package.json'));

    if (looksLikeRepository || looksLikeNodeProject) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

function resolveProjectRoot(options = {}) {
  const startDir = options.cwd || process.cwd();
  const projectRoot = options.projectRoot || findProjectRoot(startDir);

  if (!projectRoot) {
    throw new Error(`Cannot install project-level skill: ${path.resolve(startDir)} is not inside a project root with .git or package.json.`);
  }

  return projectRoot;
}

function getAgentSkillsDir(agentId, scope, options = {}) {
  assertSupportedAgent(agentId);

  const agent = SUPPORTED_AGENT_BY_ID[agentId];
  const rootDir = scope === GLOBAL_SCOPE
    ? (options.homeDir || getHomeDir())
    : resolveProjectRoot(options);

  return path.join(rootDir, agent.configDir, 'skills');
}

function getMetadataPath(targetDir) {
  return path.join(path.dirname(targetDir), `${SKILL_NAME}${METADATA_FILENAME}`);
}

function ensureSkillSourceExists(sourceDir = getSkillSourceDir()) {
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Bundled YouTrack app builder skill is missing at ${sourceDir}.`);
  }
}

function createInstallPlan(options = {}) {
  const sourceDir = getSkillSourceDir();
  const agents = expandAgents(options.agent || DEFAULT_AGENT_SELECTION);
  const scopes = expandScopes(options.scope || DEFAULT_INSTALL_SCOPE);

  ensureSkillSourceExists(sourceDir);

  return scopes.flatMap(scope => agents.map(agentId => {
    const targetDir = path.join(getAgentSkillsDir(agentId, scope, options), SKILL_NAME);
    const deploymentType = DEPLOYMENT_BY_SCOPE[scope];

    return {
      agent: agentId,
      scope,
      sourceDir,
      targetDir,
      deploymentType,
    };
  }));
}

function removePreviousInstall(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

function prepareTargetParent(targetDir) {
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
}

function copySkillDirectory(sourceDir, targetDir) {
  removePreviousInstall(targetDir);
  prepareTargetParent(targetDir);
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function symlinkSkillDirectory(sourceDir, targetDir) {
  removePreviousInstall(targetDir);
  prepareTargetParent(targetDir);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(sourceDir, targetDir, linkType);
}

function deploySkill(planItem) {
  if (planItem.deploymentType === 'symlink') {
    symlinkSkillDirectory(planItem.sourceDir, planItem.targetDir);
    return;
  }

  copySkillDirectory(planItem.sourceDir, planItem.targetDir);
}

function writeInstallMetadata(planItem) {
  const metadata = {
    skill: SKILL_NAME,
    targetAgent: planItem.agent,
    scope: planItem.scope,
    deploymentType: planItem.deploymentType,
    sourcePackage: PACKAGE_NAME,
    sourcePackageVersion: getPackageVersion(),
    targetDir: normalizeSlashes(planItem.targetDir),
    installedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    getMetadataPath(planItem.targetDir),
    JSON.stringify(metadata, null, 2)
  );

  return metadata;
}

function installSkill(options = {}) {
  return createInstallPlan(options).map(planItem => {
    deploySkill(planItem);
    const metadata = writeInstallMetadata(planItem);

    return {
      agent: planItem.agent,
      scope: planItem.scope,
      targetDir: planItem.targetDir,
      deploymentType: planItem.deploymentType,
      metadata,
    };
  });
}

function readMetadata(targetDir) {
  const metadataPath = getMetadataPath(targetDir);
  const legacyMetadataPath = path.join(targetDir, METADATA_FILENAME);
  const pathToRead = fs.existsSync(metadataPath) ? metadataPath : legacyMetadataPath;

  if (!fs.existsSync(pathToRead)) {
    return { metadata: null, metadataPath, error: null };
  }

  try {
    return {
      metadata: JSON.parse(fs.readFileSync(pathToRead, 'utf8')),
      metadataPath: pathToRead,
      error: null,
    };
  } catch (error) {
    return { metadata: null, metadataPath: pathToRead, error };
  }
}

function getInstallStatus(agentId, scope, options = {}) {
  const targetDir = path.join(getAgentSkillsDir(agentId, scope, options), SKILL_NAME);
  const metadataResult = readMetadata(targetDir);
  const targetExists = fs.existsSync(targetDir);
  const targetStats = targetExists ? fs.lstatSync(targetDir) : null;

  return {
    agent: agentId,
    scope,
    targetDir,
    installed: targetExists,
    isSymlink: Boolean(targetStats && targetStats.isSymbolicLink()),
    metadata: metadataResult.metadata,
    metadataPath: metadataResult.metadataPath,
    metadataError: metadataResult.error,
  };
}

function getSkillStatus(options = {}) {
  const agents = expandAgents(options.agent || DEFAULT_AGENT_SELECTION);
  const scopes = expandScopes(options.scope || DEFAULT_INSTALL_SCOPE);

  return scopes.flatMap(scope => (
    agents.map(agentId => getInstallStatus(agentId, scope, options))
  ));
}

function findBinary(binary, options = {}) {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(command, [binary], {
    encoding: 'utf8',
    env: options.env || process.env,
    shell: false,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (result.status !== 0) {
    return null;
  }

  return String(result.stdout || '').split(/\r?\n/).find(Boolean) || null;
}

function getAgentDiscovery(agent, options = {}) {
  const homeDir = options.homeDir || getHomeDir();
  const projectRoot = options.projectRoot || findProjectRoot(options.cwd || process.cwd());
  const globalBaseDir = path.join(homeDir, agent.configDir);
  const binaryPath = findBinary(agent.binary, options);

  return {
    agent: agent.id,
    displayName: agent.displayName,
    configDir: agent.configDir,
    binary: agent.binary,
    binaryPath,
    binaryFound: Boolean(binaryPath),
    globalBaseDir,
    globalSkillsDir: path.join(globalBaseDir, 'skills'),
    globalConfigExists: fs.existsSync(globalBaseDir),
    detected: fs.existsSync(globalBaseDir) && Boolean(binaryPath),
    projectRoot,
    projectAvailable: Boolean(projectRoot),
    projectSkillsDir: projectRoot ? path.join(projectRoot, agent.configDir, 'skills') : null,
  };
}

function runSystemAgentScan(options = {}) {
  return SUPPORTED_AGENTS.map(agent => getAgentDiscovery(agent, options));
}

function formatAgentName(agentId) {
  const agent = SUPPORTED_AGENT_BY_ID[agentId];
  return agent ? agent.displayName : agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

function formatInstallResults(results, action) {
  const verb = action === 'update' ? 'Updated' : 'Installed';
  const lines = [`${verb} YouTrack app builder skill:`];

  for (const result of results) {
    lines.push(`- ${formatAgentName(result.agent)} (${result.scope}, ${result.deploymentType}): ${result.targetDir}`);
  }

  return lines.join('\n');
}

function formatStatusResults(statuses) {
  const lines = ['YouTrack app builder skill status:'];

  for (const status of statuses) {
    const agentName = formatAgentName(status.agent);
    const deployment = status.isSymlink ? 'symlink' : 'copy';

    if (status.installed) {
      const version = status.metadata && status.metadata.sourcePackageVersion ? status.metadata.sourcePackageVersion : 'unknown';
      const installedAt = status.metadata && status.metadata.installedAt ? status.metadata.installedAt : 'unknown time';
      lines.push(`- ${agentName} (${status.scope}): installed (${deployment}, version ${version}, installed ${installedAt})`);
    } else if (status.metadataError) {
      lines.push(`- ${agentName} (${status.scope}): not installed (metadata is invalid)`);
    } else {
      lines.push(`- ${agentName} (${status.scope}): not installed`);
    }

    lines.push(`  ${status.targetDir}`);
  }

  return lines.join('\n');
}

module.exports = {
  formatInstallResults,
  formatStatusResults,
  getSkillStatus,
  installSkill,
  runSystemAgentScan,
};
