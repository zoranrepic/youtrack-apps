import {jest, describe, it, expect, beforeEach, afterEach} from '@jest/globals';
import {Config} from '../../@types/types.js';
import {logs, requirementErrors} from './commands/diagnostics.js';
import {info, search} from './commands/discovery.js';
import {deleteApp, disable, enable} from './commands/lifecycle.js';
import {attach, detach} from './commands/project-scope.js';
import {run} from './index.js';

describe('management commands', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('search finds apps and rules through the single search command', async () => {
    mockFetch([
      {
        id: 'alpha',
        name: 'Alpha App',
        enabled: true,
        rules: [{id: 'on-change', name: 'changeRule', title: 'Workflow Change'}],
      },
      {
        id: 'beta',
        name: 'Beta App',
        enabled: false,
        rules: [{id: 'scheduled', name: 'timer', title: 'Timer'}],
      },
    ]);

    await search(config(), 'workflow');

    const url = new URL(lastRequest().url);
    expect(url.pathname).toBe('/api/admin/apps');
    expect(url.searchParams.get('$top')).toBe('-1');
    expect(url.searchParams.get('fields')).toBe('id,name,enabled,rules(id,name,title)');
    expect(console.log).toHaveBeenCalledWith('Alpha App (alpha)');
    expect(console.log).toHaveBeenCalledWith('  rule: Workflow Change (on-change)');
    expect(console.log).not.toHaveBeenCalledWith('Beta App (beta)');
  });

  it('info requests expanded app fields', async () => {
    const app = {id: '148-1', name: 'scope/app', title: 'Scoped App', globalConfig: {enabled: true}, usages: [], pluggableObjects: []};
    mockFetch(app);

    await info(config({json: true}), '@scope/app');

    const url = new URL(lastRequest().url);
    expect(url.pathname).toBe('/api/admin/apps/scope/app');
    expect(url.searchParams.get('fields')).toContain('pluggableObjects');
    expect(url.searchParams.get('fields')).toContain('usages');
    expect(console.log).toHaveBeenCalledWith(JSON.stringify(app, null, 2));
  });

  it('delete refuses without confirmation before resolving the app', async () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(jest.fn() as unknown as typeof fetch);

    await deleteApp(config(), 'alpha');

    expect(console.error).toHaveBeenCalledWith(
      'Error: Deletion requires confirmation. Re-run with --yes to delete without prompting',
    );
    expect(exit).toHaveBeenCalledWith(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('delete accepts an empty success response after sending DELETE with the resolved app id', async () => {
    mockFetchSequence([appDetails(), undefined], [{status: 200}, {status: 200}]);

    await deleteApp(config({yes: true}), '@alpha');

    expect(lastRequest().method).toBe('DELETE');
    expect(new URL(lastRequest().url).pathname).toBe('/api/admin/workflows/148-1');
    expect(console.log).toHaveBeenCalledWith('App "alpha" deleted');
  });

  it('enable and disable call global config endpoints by default', async () => {
    mockFetchSequence([appDetails(), null, appDetails(), null], [{status: 200}, {status: 204}, {status: 200}, {status: 204}]);

    await enable(config(), 'alpha');
    await disable(config(), 'alpha');

    const calls = fetchCalls();
    expect(calls[1].method).toBe('PUT');
    expect(new URL(calls[1].url).pathname).toBe('/api/admin/apps/148-1/globalConfig');
    await expect(calls[1].json()).resolves.toEqual({enabled: true});
    expect(calls[3].method).toBe('PUT');
    expect(new URL(calls[3].url).pathname).toBe('/api/admin/apps/148-1/globalConfig');
    await expect(calls[3].json()).resolves.toEqual({enabled: false});
  });

  it('enable calls project configuration endpoint when --project is provided', async () => {
    mockFetchSequence([appDetails(), projectDetails(), null], [{status: 200}, {status: 200}, {status: 204}]);

    await enable(config({project: 'CP'}), 'alpha');

    const calls = fetchCalls();
    expect(new URL(calls[0].url).pathname).toBe('/api/admin/apps/alpha');
    expect(new URL(calls[1].url).pathname).toBe('/api/admin/projects/CP');
    expect(calls[2].method).toBe('PUT');
    expect(new URL(calls[2].url).pathname).toBe('/api/admin/projects/0-1/appConfigurations/184-1');
    await expect(calls[2].json()).resolves.toEqual({
      id: '184-1',
      app: {id: '148-1'},
      project: {id: '0-1'},
      enabled: true,
    });
  });

  it('attach and detach require --project', async () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(jest.fn() as unknown as typeof fetch);

    await attach(config(), 'alpha');

    expect(console.error).toHaveBeenCalledWith('Error: Option "--project" is required');
    expect(exit).toHaveBeenCalledWith(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('attach and detach resolve project shortName and update app usages', async () => {
    mockFetchSequence([
      projectDetails(),
      appDetails({usages: []}),
      null,
      projectDetails(),
      appDetails(),
      null,
    ], [
      {status: 200},
      {status: 200},
      {status: 204},
      {status: 200},
      {status: 200},
      {status: 204},
    ]);

    await attach(config({project: 'PRJ'}), 'alpha');
    await detach(config({project: 'PRJ'}), 'alpha');

    const calls = fetchCalls();
    expect(new URL(calls[0].url).pathname).toBe('/api/admin/projects/PRJ');
    expect(new URL(calls[1].url).pathname).toBe('/api/admin/apps/alpha');
    expect(calls[2].method).toBe('PUT');
    expect(new URL(calls[2].url).pathname).toBe('/api/admin/apps/148-1/usages');
    await expect(calls[2].json()).resolves.toEqual([{project: {id: '0-1'}}]);
    expect(new URL(calls[3].url).pathname).toBe('/api/admin/projects/PRJ');
    expect(new URL(calls[4].url).pathname).toBe('/api/admin/apps/alpha');
    expect(calls[5].method).toBe('PUT');
    expect(new URL(calls[5].url).pathname).toBe('/api/admin/apps/148-1/usages');
    await expect(calls[5].json()).resolves.toEqual([]);
  });

  it('logs supports --top only, with no level handling', async () => {
    mockFetchSequence([appDetails(), [{timestamp: '2026-06-09T10:00:00Z', level: 'INFO', message: 'Started'}]]);
    const logConfig = config({top: '5'}) as Config & {level: string};
    logConfig.level = 'ERROR';

    await logs(logConfig, 'alpha');

    const url = new URL(lastRequest().url);
    expect(url.pathname).toBe('/api/admin/apps/148-1/logs');
    expect([...url.searchParams.keys()]).toEqual(['$top']);
    expect(url.searchParams.get('$top')).toBe('5');
    expect(console.log).toHaveBeenCalledWith('2026-06-09T10:00:00Z INFO Started');
  });

  it('logs handles an empty success response', async () => {
    mockFetchSequence([appDetails(), undefined]);

    await logs(config(), 'alpha');

    expect(new URL(lastRequest().url).pathname).toBe('/api/admin/apps/148-1/logs');
    expect(console.log).toHaveBeenCalledWith('No log entries found');
  });

  it('requirement-errors prints requirement errors and supports --json', async () => {
    const appWithProblems = appDetails({
      pluggableObjects: [
        {
          id: '150-1',
          name: 'some-automation',
          usages: [
            {
              problems: [{problemKey: 'field_Kitolenko_EnumField', message: 'Add the Kitolenko field to the project.'}],
              configuration: {project: {id: '0-1', name: 'Car-Project', shortName: 'CP'}},
            },
          ],
        },
      ],
    });
    mockFetch(appWithProblems);

    await requirementErrors(config(), 'alpha');

    const url = new URL(lastRequest().url);
    expect(url.pathname).toBe('/api/admin/apps/alpha');
    expect(url.searchParams.get('fields')).toContain('pluggableObjects');
    expect(console.log).toHaveBeenCalledWith('field_Kitolenko_EnumField: Add the Kitolenko field to the project. [CP]');

    await requirementErrors(config({json: true}), 'alpha');

    expect(console.log).toHaveBeenCalledWith(
      JSON.stringify([
        {
          problemKey: 'field_Kitolenko_EnumField',
          message: 'Add the Kitolenko field to the project.',
          appId: '148-1',
          appName: 'alpha',
          pluggableObjectId: '150-1',
          pluggableObjectName: 'some-automation',
          projectId: '0-1',
          projectName: 'Car-Project',
          projectShortName: 'CP',
        },
      ], null, 2),
    );
  });

  it('does not expose import, export, or rules search commands', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(jest.fn() as unknown as typeof fetch);

    await run(['', '', 'import', 'alpha', '--host=foo', '--token=bar']);
    await run(['', '', 'export', 'alpha', '--host=foo', '--token=bar']);
    await run(['', '', 'rules', 'search', 'alpha', '--host=foo', '--token=bar']);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

function config(overrides: Partial<Config> = {}): Config {
  return {
    host: 'https://foo',
    token: 'bar',
    output: null,
    overwrite: null,
    manifest: null,
    schema: null,
    open: null,
    json: false,
    yes: false,
    project: null,
    top: null,
    cwd: process.cwd(),
    ...overrides,
  };
}

function mockFetch(data: unknown, init: {status?: number; statusText?: string} = {status: 200}): jest.SpiedFunction<typeof fetch> {
  const status = init.status ?? 200;
  return jest.spyOn(global, 'fetch').mockImplementation(
    jest.fn(() =>
      Promise.resolve(new Response(status === 204 ? null : JSON.stringify(data), {...init, status})),
    ) as unknown as typeof fetch,
  );
}

function mockFetchSequence(
  data: unknown[],
  init: {status?: number; statusText?: string}[] = data.map(() => ({status: 200})),
): jest.SpiedFunction<typeof fetch> {
  return jest.spyOn(global, 'fetch').mockImplementation(
    jest.fn(() => {
      const responseData = data.shift();
      const responseInit = init.shift() ?? {status: 200};
      const status = responseInit.status ?? 200;
      const body = status === 204 || responseData === undefined ? null : JSON.stringify(responseData);
      return Promise.resolve(new Response(body, {...responseInit, status}));
    }) as unknown as typeof fetch,
  );
}

function lastRequest(): Request {
  const calls = fetchCalls();
  return calls[calls.length - 1];
}

function fetchCalls(): Request[] {
  return (global.fetch as jest.MockedFunction<typeof fetch>).mock.calls.map(call => call[0] as Request);
}

function appDetails(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: '148-1',
    name: 'alpha',
    title: 'Alpha',
    globalConfig: {enabled: true},
    usages: [
      {
        id: '184-1',
        enabled: true,
        project: {id: '0-1', name: 'Car-Project', shortName: 'CP'},
      },
    ],
    pluggableObjects: [],
    ...overrides,
  };
}

function projectDetails(): Record<string, unknown> {
  return {
    id: '0-1',
    name: 'Car-Project',
    shortName: 'CP',
  };
}
