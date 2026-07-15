const { styleText } = require("node:util");

const createApp = 'npx @jetbrains/create-youtrack-app';

console.log(`
${styleText("bold", 'Create YouTrack App')}

Use this generator to create a new YouTrack app or add features to an existing
app directory. Run commands from the directory where the app should be created
or modified.

${styleText("bold", 'Create a New App')}

Interactive setup:
  ${styleText("magenta", createApp)}
  ${styleText("dim", '# npm create @jetbrains/youtrack-app and npm init @jetbrains/youtrack-app run the same initializer flow')}

Non-interactive setup:
  ${styleText("magenta", `${createApp} --name my-youtrack-app --title "My YouTrack App" --description "Internal YouTrack app" --vendor "My Company" --vendor-url "https://example.com"`)}

Choose the generated app shape:
  ${styleText("magenta", `${createApp} --name my-js-app --type js`)} ${styleText("dim", '# JavaScript app shell')}
  ${styleText("magenta", `${createApp} --name my-ts-app --type ts`)} ${styleText("dim", '# TypeScript Enhanced DX app; default')}
  ${styleText("magenta", `${createApp} --name backend-api --type ts --backend-only`)} ${styleText("dim", '# Enhanced DX without the sample widget')}

${styleText("bold", 'Direct npx Commands')}

Most commands below run from an existing app directory. Use the interactive form
when you want prompts, or pass flags to generate non-interactively.

  ${styleText("magenta", `${createApp} --help`)}
    Show this help.

  ${styleText("magenta", `${createApp} settings init`)}
    Create src/settings.json.

  ${styleText("magenta", `${createApp} settings init --title "Settings" --description "App configuration"`)}
    Create src/settings.json without prompts.

  ${styleText("magenta", `${createApp} settings add --name apiUrl --type string`)}
    Add a property to src/settings.json.

  ${styleText("magenta", `${createApp} widget add`)}
    Add a widget using the interactive generator.

  ${styleText("magenta", `${createApp} widget --key issue-panel --extension-point ISSUE_BELOW_SUMMARY`)}
    Add a widget without prompts.

  ${styleText("magenta", `${createApp} widget --key dashboard-card --extension-point DASHBOARD_WIDGET --name "Dashboard Card"`)}
    Add a named dashboard widget without prompts.

  ${styleText("magenta", `${createApp} extension-property add`)}
    Declare an app-owned entity extension property.

  ${styleText("magenta", `${createApp} property Issue.customStatus`)}
    Declare an extension property without prompts.

  ${styleText("magenta", `${createApp} p Issue.tags --type string --set`)}
    Declare a multi-value extension property using the short alias.

  ${styleText("magenta", `${createApp} http-handler add`)}
    Add an HTTP handler. In Enhanced DX apps, this uses the richer route flow.

  ${styleText("magenta", `${createApp} handler global/health`)}
    Add an Enhanced DX GET handler without prompts.

  ${styleText("magenta", `${createApp} h issue/comments --method POST --permissions READ_ISSUE,UPDATE_ISSUE`)}
    Add an Enhanced DX POST handler with permissions using the short alias.

  ${styleText("magenta", `${createApp} endpoint add`)}
    Add a typed Enhanced DX router endpoint using the interactive generator.

  ${styleText("magenta", `${createApp} rule add onChange notify-on-change`)}
    Add a classic workflow rule.

  ${styleText("magenta", `${createApp} skill install`)}
    Install the YouTrack app builder skill for supported coding agents.

  ${styleText("magenta", `${createApp} skill status`)}
    Show where the YouTrack app builder skill is installed.

${styleText("bold", 'JavaScript App (--type js)')}

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
  ${styleText("dim", '- Widget generation creates src/widgets/<key>/, updates manifest.json, and adds a Vite entry.')}
  ${styleText("dim", '- Rule scaffolding creates the workflow source file and does not update manifest.json.')}
  ${styleText("dim", '- npm run build can package backend-only apps before widgets exist.')}

${styleText("bold", 'TypeScript App (--type ts / Enhanced DX)')}

Enhanced DX apps include TypeScript, file-based backend routing, generated API
types, a typed frontend client, and Vite plugins for local development.
The default scaffold includes a sample ${styleText("cyan", 'MAIN_MENU_ITEM')} widget and example routes:
${styleText("cyan", 'global/demo')}, ${styleText("cyan", 'global/echo')} (${styleText("cyan", 'POST')}), ${styleText("cyan", 'issue/details')}, and ${styleText("cyan", 'project/demo')}.

Common commands:
  ${styleText("magenta", 'npm run dev')}
    Rebuild and upload continuously during development.

  ${styleText("magenta", 'npm run build')}
    Build backend and frontend, then validate dist.

Enhanced DX features:
  ${styleText("bold", 'File-based routing:')} create handlers in ${styleText("cyan", 'src/backend/router/<scope>/<path>/<METHOD>.ts')}.
  ${styleText("bold", 'Handler contracts:')} add ${styleText("magenta", '@zod-to-schema')} to exported request/response types and export ${styleText("cyan", 'type Handle = typeof handle')}.
  ${styleText("bold", 'Generated API types:')} backend builds generate route types in ${styleText("cyan", 'src/api/api.d.ts')} and Zod schemas in ${styleText("cyan", 'src/api/api.zod.ts')}.
  ${styleText("bold", 'Typed client:')} widgets call backend handlers through the generated client from ${styleText("cyan", 'src/api')}.
    ${styleText("magenta", 'import {createApi} from "@/api";')}
    ${styleText("magenta", 'const host = await YTApp.register();')}
    ${styleText("magenta", 'const api = createApi(host);')}
    ${styleText("magenta", 'const result = await api.project.demo.GET({projectId: "DEMO", message: "hello"});')}
  ${styleText("bold", 'Dev validation:')} Zod validation runs in development builds.
  ${styleText("bold", 'Build order:')} backend builds first so generated API files exist before frontend code imports them.
  ${styleText("bold", 'Widget generation:')} creates ${styleText("cyan", 'src/widgets/<key>/')} and updates ${styleText("cyan", 'manifest.json')}; Vite discovers widget entries automatically.
`);
