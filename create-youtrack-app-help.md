create-youtrack-app --help

Create YouTrack App

Use this generator to create a new YouTrack app or add features to an existing
app directory. Run commands from the directory where the app should be created
or modified.

Create a New App

Interactive setup:
  npx @jetbrains/create-youtrack-app
  # npm create @jetbrains/youtrack-app and npm init @jetbrains/youtrack-app run the same initializer flow

Non-interactive setup:
  npx @jetbrains/create-youtrack-app --name my-youtrack-app
  # Only --name is required. Title, description, vendor, and vendor URL are optional.

Choose the generated app shape:
  npx @jetbrains/create-youtrack-app --name my-ts-app # TypeScript Enhanced DX app; default
  npx @jetbrains/create-youtrack-app --name my-js-app --type js # JavaScript app shell
  npx @jetbrains/create-youtrack-app --name backend-api --type ts --backend-only # Enhanced DX without the sample widget

Commands for both ts and js apps

These commands work in both JavaScript and TypeScript app directories.

  npx @jetbrains/create-youtrack-app settings init
    Interactive: create src/settings.json.

  npx @jetbrains/create-youtrack-app settings init --title "Settings" --description "App configuration"
    Non-interactive: create src/settings.json.

  npx @jetbrains/create-youtrack-app settings add
    Interactive: add a property to src/settings.json.

  npx @jetbrains/create-youtrack-app settings add --name apiUrl --type string
    Non-interactive: add a property to src/settings.json.

  npx @jetbrains/create-youtrack-app widget add
    Interactive: add a widget.

  npx @jetbrains/create-youtrack-app widget --key issue-panel --extension-point ISSUE_BELOW_SUMMARY
    Non-interactive: add a widget.

  npx @jetbrains/create-youtrack-app widget --key dashboard-card --extension-point DASHBOARD_WIDGET --name "Dashboard Card"
    Non-interactive: add a named dashboard widget.

  npx @jetbrains/create-youtrack-app extension-property add
    Interactive: declare an app-owned entity extension property.

  npx @jetbrains/create-youtrack-app property Issue.customStatus
    Non-interactive: declare an extension property.

  npx @jetbrains/create-youtrack-app p Issue.tags --type string --set
    Non-interactive: declare a multi-value extension property using the short alias.

  npx @jetbrains/create-youtrack-app http-handler add
    Interactive: add an HTTP handler.
    
  npm run build
    Build backend and frontend, then validate dist. Works for backend only apps as well.

JavaScript App (--type js)

JavaScript apps start as backend.js and manifest.js. Add rule/script types.

Classic workflow rule templates:
  npx @jetbrains/create-youtrack-app rule add onChange notify-on-change
  npx @jetbrains/create-youtrack-app rule add onSchedule weekly-digest
  npx @jetbrains/create-youtrack-app rule add action apply-template
  npx @jetbrains/create-youtrack-app rule add stateMachine issue-state
  npx @jetbrains/create-youtrack-app rule add sla first-reply-sla

Generated files:
  src/workflows/<name>.js

Notes:
  - Widget generation creates src/widgets/<key>/, updates manifest.json, and adds a Vite entry.
  - npm run build can package backend-only apps before widgets exist.

TypeScript App (--type ts / Enhanced DX)

Enhanced DX apps include TypeScript, file-based backend routing, generated API
types, a typed frontend client, and Vite plugins for local development.
The default scaffold includes a sample MAIN_MENU_ITEM widget and example routes:
global/demo, global/echo (POST), issue/details, and project/demo.

Common commands:
  npm run dev
    Rebuild and upload continuously during development.

Enhanced DX-only generator commands:
  npx @jetbrains/create-youtrack-app handler global/health
    Non-interactive: add a GET handler.

  npx @jetbrains/create-youtrack-app handler project/users --method POST
    Non-interactive: add a POST handler.

  npx @jetbrains/create-youtrack-app h issue/comments --method POST --permissions READ_ISSUE,UPDATE_ISSUE
    Non-interactive: add a POST handler with permissions using the short alias.

  npx @jetbrains/create-youtrack-app endpoint add
    Interactive: add a typed router endpoint with scope, path, method, request type, and response type prompts.

Enhanced DX features:
  File-based routing: create handlers in src/backend/router/<scope>/<path>/<METHOD>.ts.
  Handler contracts: add @zod-to-schema to exported request/response types and export type Handle = typeof handle.
  Generated API types: backend builds generate route types in src/api/api.d.ts and Zod schemas in src/api/api.zod.ts.
  Typed client: widgets call backend handlers through the generated client from src/api.
    import {createApi} from "@/api";
    const host = await YTApp.register();
    const api = createApi(host);
    const result = await api.project.demo.GET({projectId: "DEMO", message: "hello"});
  Dev validation: Zod validation runs in development builds.
  Build order: backend builds first so generated API files exist before frontend code imports them.
  Widget generation: creates src/widgets/<key>/ and updates manifest.json; Vite discovers widget entries automatically.

Agent Skill

  npx @jetbrains/create-youtrack-app skill install
    Interactive: install the YouTrack app builder skill for supported coding agents.

  npx @jetbrains/create-youtrack-app skill status
    Non-interactive: show installed skill status for supported coding agents.