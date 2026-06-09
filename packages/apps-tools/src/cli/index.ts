import pkg from '../../package.json' with { type: 'json' };
import {i18n} from '../../lib/i18n/i18n.js';
import {exit} from '../../lib/cli/exit.js';
import {parse} from '../../lib/cli/parseargv.js';
import {Config, RequiredParams} from '../../@types/types.js';
import {list} from './commands/list.js';
import {download} from './download.js';
import {upload} from './upload.js';
import {resolve} from '../../lib/net/resolve.js';
import {validate} from './validate.js';
import {info, search} from './commands/discovery.js';
import {deleteApp, disable, enable} from './commands/lifecycle.js';
import {attach, detach} from './commands/project-scope.js';
import {logs, requirementErrors} from './commands/diagnostics.js';

const options = {
  list: list,
  download: download,
  upload: upload,
  validate: validate,
  search: search,
  info: info,
  delete: deleteApp,
  enable: enable,
  disable: disable,
  attach: attach,
  detach: detach,
  logs: logs,
  'requirement-errors': requirementErrors,
} as const;

export async function run(argv = process.argv) {
  const args = parse(argv);
  const {YOUTRACK_HOST, YOUTRACK_API_TOKEN} = process.env;
  const config: Config = {
    host: args.host || YOUTRACK_HOST || null,
    token: args.token || YOUTRACK_API_TOKEN || null,
    output: args.output || null,
    overwrite: args.overwrite || null,
    manifest: args.manifest || null,
    schema: args.schema || null,
    open: args.open || null,
    json: isFlagEnabled(args.json),
    yes: isFlagEnabled(args.yes),
    project: args.project || null,
    top: args.top ? args.top.toString() : null,
    cwd: process.cwd(),
  };

  if (args.version || args.v) {
    return printVersion();
  }

  const option = args._[0];
  switch (option) {
    case 'list':
    case 'download':
    case 'upload':
    case 'search':
    case 'info':
    case 'delete':
    case 'enable':
    case 'disable':
    case 'attach':
    case 'detach':
    case 'logs':
    case 'requirement-errors':
      await checkRequiredParams(['host', 'token'], args, async () => {
        const executable = options[option];
        const commandArg = option === 'search' ? args._.slice(1).join(' ') : args._.slice(1)[0];
        await executable(config, commandArg);
      });
      return;
    case 'validate':
      await options['validate'](config, args._.slice(1)[0]);
      return;
    case 'version':
      printVersion();
      return;
    default:
      printHelp();
      return;
  }

  function printHelp() {
    br();
    printLine(i18n('list     --host --token                      '), i18n('View a list of installed apps'));
    printLine(i18n('download <app> [--output, --overwrite]       '), i18n('Download an app'));
    printLine(i18n('upload   <directory>                         '), i18n('Upload app to server'));
    printLine(i18n('validate <directory> [--manifest, --schema]  '), i18n('Validate manifest'));
    printLine(i18n('search   <query> [--json]                    '), i18n('Search apps and rules'));
    printLine(i18n('info     <app> [--json]                      '), i18n('Show app details'));
    printLine(i18n('delete   <app> [--yes]                       '), i18n('Delete an app'));
    printLine(i18n('enable   <app> [--project <short-name>]      '), i18n('Enable an app'));
    printLine(i18n('disable  <app> [--project <short-name>]      '), i18n('Disable an app'));
    printLine(i18n('attach   <app> --project <short-name>        '), i18n('Attach an app to a project'));
    printLine(i18n('detach   <app> --project <short-name>        '), i18n('Detach an app from a project'));
    printLine(i18n('logs     <app> [--top N, --json]             '), i18n('Show app logs'));
    printLine(i18n('requirement-errors <app> [--json]            '), i18n('Show app requirement errors'));
    br();
    console.log(
      i18n('One can also provide host and token via environment variables $YOUTRACK_HOST and $YOUTRACK_API_TOKEN.'),
    );

    function br() {
      console.log('');
    }

    function printLine(option: string, description: string) {
      console.log('    ' + option + '   ' + description);
    }
  }

  async function checkRequiredParams(
    required: RequiredParams[],
    args: Record<string, unknown>,
    fn: () => Promise<void>,
  ): Promise<void> {
    function allParamsProvided(params: RequiredParams[], args: Record<string, unknown>): boolean {
      return params.every(param => {
        if ((!args.hasOwnProperty(param) || !args[param]) && !config[param]) {
          if (param === 'token') {
            const createTokenUrl = `${resolve(config.host, 'users/me?tab=account-security').href}`;
            exit(new Error(i18n(`Token is required. Please create one at ${createTokenUrl}`)));
          } else {
            exit(new Error(i18n('Option "--' + param + '" is required')));
          }

          return false;
        }
        return true;
      });
    }

    if (allParamsProvided(required, args)) await fn();
  }

  function printVersion() {
    console.log(pkg.version);
  }

  function isFlagEnabled(value: unknown): boolean {
    return value !== undefined && value !== false && value !== 'false';
  }
}
