# Features

This document tracks notable changes in `packages/apps-tools` and
`packages/create-youtrack-app`. 

## Solved Problems

### Skill Installer in CLI

**Problem:** Skill distribution

**Solution:** `create-youtrack-app skill install` installs the
`youtrack-app-builder` skill. Global installation uses symlinks in the agent
home config, while project-level installation copies the skill into the current
project directory. `create-youtrack-app skill status` shows where the skill is
installed and for what agents.

### Project Shape Scaffolding

**Problem:** There was no direct scaffolding for classic YouTrack scripts / workflows. 

**Solution:** `create-youtrack-app rule add <type> <name>` scaffolds classic
workflow rules under `src/workflows/<name>.js` for `onChange`,
`onSchedule`, `action`, `stateMachine`, and `sla` rules. Each rule type gets a
matching template shape, with validation for rule type and filename.

### App Management Tooling and Common Workflows

**Problem:** Uploading, inspecting, and operating on apps required manual
YouTrack UI work or custom REST calls. We avoided relying on YouTrack MCP for
these common flows because it consumed more tokens than direct CLI commands. Also, more instance exploration commands were added, because app logic often depends on live instance data such as groups, project fields, users and tags.

**Solution:** `youtrack-app` now exposes app lifecycle and inspection commands
for `list`, `info`, `upload`, `download`, `validate`, `scripts`,
`settings`, `settings-set`, `delete`, `enable`, `disable`, `attach`, `detach`,
`logs`, `script-logs`, `requirement-errors` plus more instance exploration commands. Commands accept
`YOUTRACK_HOST` and `YOUTRACK_API_TOKEN`, and can emit structured output where
automation needs it.

### Parameterized App Creation CLI
**Problem:** Interactive app creation worked for humans, but agents could not
use it efficiently.

**Solution:** New app creation accepts non-interactive flags such as
`--app-name`, `--title`, `--description`, `--vendor`, `--vendor-url`,
`--type`. The default type is TypeScript `--template ts` Enhanced DX app
and `--type js` creates the JavaScript Vite app, and
dependencies are installed after scaffolding.

### More Verbose `--help`

**Problem:** Large portion of the `SKILL.md` contents was related to **CLI** commands. While at the same time `packages` have their own `--help` commands for this purpose. 

**Solution:** Move the command explanation from skill sources into the `--help` for each package. This gives us, cleaner `SKILL.md` and more room in context for additional information. Also, we made sure that command calls were constant across the `--help`, by using `npx`. 


## Open questions

### Point of having `--backend-only` flag for Enhanced DX apps
**Question:** Why do we have `--backend-only` flag when scaffolding `enhanced dx` apps?
//  Sasha will address this from the idea point

### Structure of --help and mirrored commands for both ts and js
**Question:** Can we achieve consistency across TS and JS commands?

### Wording of `Enhanced DX`
**Question:** Can it be renamed to `advanced tools` since it indeed provides advanced tooling. In fresh context `Enhanced DX` is not self explanatory in terms of what it provides?
// Communicate with tech writers - or no need since it is already on dev portal

### Consistent command structure in `apps-tools` 
**Question:** Can we make all commands follow the same pattern like `youtrack-app <entity> <action> [--param value] [--param2 value]`? There will be some non-ordinary cases like `youtrack-app app`. Do we keep this backward comaptible or just bump the major version?

### AGENTS.md
**Question:** What should be the source of thurth for `ts` apps ; `skill` or `agents.md` or both? 
// We choose only one source of thurth - SKILL

### TS vs JS default scaffolding
**Question:** What are the main points of having TS default scaffolding?

### Release of the preview version
**Question:** Currently our system consists of `youtrack-apps` forked repository and `youtrack-app-agent-kit` repository which holds the `SKILL` resource files. We aim to release a preview version of the `skill` system. 
Notes:
- `SKILL` is configured to use the `forked` version of `youtrack-apps` - implies merging features into original repo under some `beta` (tbd)
- we need to release internally - skill is up to date with latest API 
- we need to release to design partners - skill is up to date to latest released API
// release to npm with special named version (multiple channels)