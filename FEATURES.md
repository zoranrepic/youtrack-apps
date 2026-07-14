# Features

This document tracks notable changes in `packages/apps-tools` and
`packages/create-youtrack-app`. The first section keeps the original
problem-solution framing for board items. The second section lists the
resulting feature surface.

## Solved Problems

### Skill Installer in CLI

**Problem:** Skill installation was manual and inconsistent across supported
agents.

**Solution:** `create-youtrack-app skill install` installs the bundled
`youtrack-app-builder` skill. Global installation uses symlinks in the agent
home config, while project-level installation copies the skill into the current
project directory. `create-youtrack-app skill status` shows where the skill is
installed and which deployment mode is used.

### Project Shape Scaffolding

**Problem:** There was no direct scaffolding for classic YouTrack workflow rule
types.

**Solution:** `create-youtrack-app rule add <type> <name>` scaffolds classic
workflow rules under `src/backend/workflows/<name>.js` for `onChange`,
`onSchedule`, `action`, `stateMachine`, and `sla` rules. Each rule type gets a
matching template shape, with validation for rule type and filename.

### App Management Tooling and Common Workflows

**Problem:** Uploading, inspecting, and operating on apps required manual
YouTrack UI work or custom REST calls. We avoided relying on YouTrack MCP for
these common flows because it consumed more tokens than direct CLI commands.

**Solution:** `youtrack-app` now exposes app lifecycle and inspection commands
for `list`, `search`, `info`, `upload`, `download`, `validate`, `scripts`,
`settings`, `settings-set`, `delete`, `enable`, `disable`, `attach`, `detach`,
`logs`, `script-logs`, and `requirement-errors`. Commands accept
`YOUTRACK_HOST` and `YOUTRACK_API_TOKEN`, and can emit structured output where
automation needs it.

### Parameterized App Creation CLI

**Problem:** Interactive app creation worked for humans, but agents could not
use it efficiently.

**Solution:** New app creation accepts non-interactive flags such as
`--app-name`, `--title`, `--description`, `--vendor`, `--vendor-url`,
`--template`, and `--yes`. The default template is JavaScript, `--template ts`
and `--template enhanced-dx` create the TypeScript Enhanced DX app, and
dependencies are installed after scaffolding.

### Instance Exploration Commands and Agent Instructions

**Problem:** Building app logic often depends on live YouTrack instance details
such as project IDs, project fields, tags, users, groups, app settings, and
script logs. Agents needed a repeatable CLI workflow for discovering that data.

**Solution:** `youtrack-app` includes exploration commands for projects,
project fields, groups, group members, users, and tags, with pagination and
JSON/YAML output where useful. The bundled `youtrack-app-builder` skill now
documents app management, project/module scaffolding, deployment steps, and
instance exploration commands so agents can follow a consistent workflow.
