const { styleText } = require("node:util");

const createApp = 'npx @jetbrains/create-youtrack-app';

console.log(`
${styleText("bold", 'Create YouTrack App')}

Use this generator to create a new YouTrack app or add features to an existing
app directory. Run commands from the directory where the app should be created
or modified.

${styleText("bold", 'Create a New App')}

Interactive setup:
  ${styleText("magenta", 'npm create @jetbrains/youtrack-app')}

Non-interactive setup:
  ${styleText("magenta", `${createApp} --app-name my-youtrack-app --title "My YouTrack App" --description "Internal YouTrack app" --vendor "My Company" --vendor-url "https://example.com"`)}

Choose the generated app shape:
  ${styleText("magenta", `${createApp} --template js`)} ${styleText("dim", '# JavaScript app shell; default')}
  ${styleText("magenta", `${createApp} --template ts`)} ${styleText("dim", '# TypeScript Enhanced DX app')}

${styleText("bold", 'Direct npx Commands')}

These commands work from an existing app directory:

  ${styleText("magenta", `${createApp} --help`)}
    Show this help.

  ${styleText("magenta", `${createApp} settings init`)}
    Create src/settings.json.

  ${styleText("magenta", `${createApp} settings add --name apiUrl --type string`)}
    Add a property to src/settings.json.

  ${styleText("magenta", `${createApp} widget add`)}
    Add a widget using the interactive generator.

  ${styleText("magenta", `${createApp} extension-property add`)}
    Declare an app-owned entity extension property.

  ${styleText("magenta", `${createApp} http-handler add`)}
    Add an HTTP handler. In Enhanced DX apps, this uses the richer route flow.

  ${styleText("magenta", `${createApp} rule add onChange notify-on-change`)}
    Add a classic workflow rule.

  ${styleText("magenta", `${createApp} skill install`)}
    Install the YouTrack app builder skill for supported coding agents.

  ${styleText("magenta", `${createApp} skill status`)}
    Show where the YouTrack app builder skill is installed.

${styleText("bold", 'JavaScript App (--template js)')}

JavaScript apps start as a minimal app shell with manifest and build tooling.
Use generator commands to add app surfaces as needed.

Classic workflow rule templates:
  ${styleText("magenta", `${createApp} rule add onChange notify-on-change`)}
  ${styleText("magenta", `${createApp} rule add onSchedule weekly-digest`)}
  ${styleText("magenta", `${createApp} rule add action apply-template`)}
  ${styleText("magenta", `${createApp} rule add stateMachine issue-state`)}
  ${styleText("magenta", `${createApp} rule add sla first-reply-sla`)}

Generated files:
  ${styleText("cyan", 'src/backend/workflows/<name>.js')}

Notes:
  ${styleText("dim", '- Rule scaffolding creates the workflow source file and does not update manifest.json.')}
  ${styleText("dim", '- npm run build can package backend-only apps before widgets exist.')}

${styleText("bold", 'TypeScript App (--template ts / Enhanced DX)')}

Enhanced DX apps include TypeScript, file-based backend routing, generated API
types, a typed frontend client, and Vite plugins for local development.

Common commands:
  ${styleText("magenta", 'npm run dev')}
    Rebuild and upload continuously during development.

  ${styleText("magenta", 'npm run build')}
    Build backend and frontend, then validate dist.

Add widgets:
  ${styleText("magenta", `${createApp} widget --key my-panel --extension-point ISSUE_BELOW_SUMMARY`)}
  ${styleText("magenta", `${createApp} widget --key admin-page --extension-point MAIN_MENU_ITEM --name "Admin Page"`)}

Add HTTP handlers:
  ${styleText("magenta", `${createApp} handler global/health`)}              ${styleText("dim", '# GET handler by default')}
  ${styleText("magenta", `${createApp} handler project/users --method POST`)}
  ${styleText("magenta", `${createApp} h issue/comments --method POST --permissions read-issue,update-issue`)}

Add extension properties:
  ${styleText("magenta", `${createApp} property Issue.customStatus`)}         ${styleText("dim", '# string type by default')}
  ${styleText("magenta", `${createApp} property Comment.rating --type integer`)}
  ${styleText("magenta", `${createApp} p Issue.tags --type string --set`)}    ${styleText("dim", '# multi-value property')}

Add settings:
  ${styleText("magenta", `${createApp} settings init --title "Settings" --description "App configuration"`)}
  ${styleText("magenta", `${createApp} settings add --name apiUrl --type string`)}
  ${styleText("magenta", `${createApp} s init --title "Settings" --description "App configuration"`)} ${styleText("dim", '# short alias')}

Enhanced DX features:
  ${styleText("bold", 'File-based routing:')} create handlers in ${styleText("cyan", 'src/backend/router/<scope>/<path>/<METHOD>.ts')}.
  ${styleText("bold", 'Generated API types:')} annotated endpoint request/response types generate ${styleText("cyan", 'src/api/api.d.ts')} and ${styleText("cyan", 'src/api/api.zod.ts')}.
  ${styleText("bold", 'Typed client:')} widgets call backend handlers through the generated client from ${styleText("cyan", 'src/api')}.
  ${styleText("bold", 'Dev validation:')} Zod validation runs in development builds.

${styleText("bold", 'Agent Skill')}

  ${styleText("magenta", `${createApp} skill install`)}
    Detect supported agents and choose global or project installation.

  ${styleText("magenta", `${createApp} skill status`)}
    Show installed skill status for supported agents.
`);
