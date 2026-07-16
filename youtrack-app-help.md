
youtrack-app <command> [options]

Manage, inspect, and debug YouTrack apps from an external development environment.
Most commands require --host and --token. You can also set YOUTRACK_HOST and YOUTRACK_API_TOKEN.

App lifecycle:
  upload <directory> [--open]
    Does: Uploads a local app package to the YouTrack instance.
    Args: <directory> is a local app directory or built package directory, usually dist. --open opens app settings after upload.
  download <app> [--output DIR] [--overwrite]
    Does: Downloads an app package from the YouTrack instance and extracts it locally.
    Args: <app> is an app ID, package name, or title. --output selects the local destination.
  validate <directory> [--manifest FILE] [--schema FILE]
    Does: Validates local app manifest files against the YouTrack app JSON schema without connecting to YouTrack.
    Args: <directory> is a local app directory. --manifest and --schema override the default files.
  delete <app> [--yes]
    Does: Deletes an installed app from the YouTrack instance.
    Args: <app> is an app ID, package name, or title. --yes skips the confirmation prompt.
  enable <app> [--project <short-name>]
    Does: Enables an installed app globally in the YouTrack instance, or enables its usage for one project.
    Args: <app> is an app ID, package name, or title. --project is a project short name such as DEMO or JT.
  disable <app> [--project <short-name>]
    Does: Disables an installed app globally in the YouTrack instance, or disables its usage for one project.
    Args: <app> is an app ID, package name, or title. --project is a project short name such as DEMO or JT.
  attach <app> --project <short-name>
    Does: Attaches an installed app to a project in the YouTrack instance.
    Args: <app> is an app ID, package name, or title. <short-name> is the project key, for example DEMO or JT.
  detach <app> --project <short-name>
    Does: Detaches an installed app from a project in the YouTrack instance.
    Args: <app> is an app ID, package name, or title. <short-name> is the project key to remove from app usages.

App inspection and configuration:
  list [--skip N] [--limit N] [--json]
    Does: Lists installed apps visible to the token in the YouTrack instance, with page metadata for large app lists.
    Args: --skip and --limit page through large result sets; --json prints the raw page object.
  search <query> [--skip N] [--limit N] [--json]
    Does: Finds installed apps in the YouTrack instance whose title matches the query text.
    Args: <query> is a full or partial app title, for example "Slack"; --skip and --limit page through matches.
  info <app> [--json]
    Does: Shows one installed app in the YouTrack instance with enabled state, project usages, rules, and requirement errors.
    Args: <app> is an app ID, package name, or title.
  scripts <app> [--json]
    Does: Shows package metadata, manifest content, settings schema, entity extensions, and script source files from an installed app in the YouTrack instance.
    Args: <app> is an app ID, package name, or title.
  settings <app> [--project <short-name>] [--json]
    Does: Reads global app settings or project-scoped settings from the YouTrack instance.
    Args: <app> is resolved by title or package name. --project is a project short name.
  settings-set <app> [--project <short-name>] [--settings JSON] [--enabled true|false]
    Does: Updates app settings and/or enabled state in the YouTrack instance.
    Args: --settings is a JSON object string. Without --project it writes global settings; with --project it writes project settings.
  logs <app> [--top N] [--json]
    Does: Shows recent app-level log entries from the YouTrack instance.
    Args: <app> is an app ID, package name, or title. --top limits how many entries are requested.
  script-logs <app> <script> [--skip N] [--limit N] [--json]
    Does: Shows paged log entries from the YouTrack instance for one script, module, or workflow rule.
    Args: <app> is an app ID, package name, or title. <script> is a script, module, rule ID, rule name, or rule title.
  requirement-errors <app> [--json]
    Does: Shows broken requirement problems reported by app usages in the YouTrack instance.
    Args: <app> is an app ID, package name, or title.

Instance exploration:
  project-list [--skip N] [--limit N] [--json] [--yaml]
    Does: Lists projects in the YouTrack instance with short names and IDs for later project-scoped commands.
    Args: --skip and --limit page through large project lists.
  project-info <project> [--yaml]
    Does: Shows identifying details for one project in the YouTrack instance.
    Args: <project> is an exact project ID, short name, or name.
  project-fields <project> [--yaml]
    Does: Lists the issue field schema for one project in the YouTrack instance, including custom field types, required fields, and allowed values when available.
    Args: <project> is an exact project ID, short name, or name.
  tag-search <query> [--project <short-name>] [--skip N] [--limit N] [--json] [--yaml]
    Does: Searches visible usable tags in the YouTrack instance, optionally narrowed to tags relevant for one project.
    Args: <query> is tag name text. --project is a project short name; --skip and --limit page through matches.
  group-list [--skip N] [--limit N] [--json] [--yaml]
    Does: Lists user groups and project teams in the YouTrack instance with IDs and user counts.
    Args: --skip and --limit page through large group lists.
  group-members <group> [--yaml]
    Does: Shows direct members of one user group or project team in the YouTrack instance.
    Args: <group> is an exact user group or project team ID or name.
  user-list [--skip N] [--limit N] [--json] [--yaml]
    Does: Lists users in the YouTrack instance with login, ID, and display name for later user lookup.
    Args: --skip and --limit page through large user lists.
  user-info <user> [--yaml]
    Does: Shows profile details for one user in the YouTrack instance, including email, guest state, and user type when visible.
    Args: <user> is an exact user ID, login, username, or full name.

Common options:
  --host <url>                                                                  YouTrack instance URL. Overrides YOUTRACK_HOST.
  --token <token>                                                               Permanent token. Overrides YOUTRACK_API_TOKEN.
  --json                                                                        Print machine-readable JSON for commands that support it.
  --yaml                                                                        Print YAML for commands that support it.
  --skip N, --limit N                                                           Page through list-style command results.
  version, --version, -v                                                        Print the CLI version.