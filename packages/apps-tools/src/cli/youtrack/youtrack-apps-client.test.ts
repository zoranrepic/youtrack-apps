import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {Config} from '../../../@types/types.js';
import {YouTrackAppsClient} from './youtrack-apps-client.js';

describe('YouTrackAppsClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe.each([
    ['apps', '/api/admin/apps', (client: YouTrackAppsClient) => client.listApps(['id'], {all: true})],
    ['projects', '/api/admin/projects', (client: YouTrackAppsClient) => client.listProjects(['id'], {all: true})],
    ['groups', '/api/groups', (client: YouTrackAppsClient) => client.listGroups({all: true})],
    ['users', '/api/users', (client: YouTrackAppsClient) => client.listUsers({all: true})],
  ])('list %s', (_name, path, requestList) => {
    it('uses repeated skip/top pagination for all results', async () => {
      const firstPage = Array.from({length: 100}, (_value, index) => ({id: `item-${index}`}));
      const secondPage = [{id: 'item-100'}];
      const requests: Request[] = [];

      jest.spyOn(global, 'fetch').mockImplementation(async request => {
        requests.push(request as Request);
        const url = new URL((request as Request).url);
        const skip = Number(url.searchParams.get('$skip') ?? '0');
        return new Response(JSON.stringify(skip === 0 ? firstPage : secondPage), {status: 200});
      });

      const result = await requestList(new YouTrackAppsClient(config()));

      expect(result.items).toHaveLength(101);
      expect(result.pagination.hasMore).toBe(false);
      expect(requests).toHaveLength(2);
      expect(new URL(requests[0].url).pathname).toBe(path);
      expect(new URL(requests[0].url).searchParams.get('$skip')).toBe('0');
      expect(new URL(requests[0].url).searchParams.get('$top')).toBe('100');
      expect(new URL(requests[1].url).pathname).toBe(path);
      expect(new URL(requests[1].url).searchParams.get('$skip')).toBe('100');
      expect(new URL(requests[1].url).searchParams.get('$top')).toBe('100');
    });
  });

  it('listApps defaults to the first 50 results', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify(Array.from({length: 50}, (_value, index) => ({id: `item-${index}`}))), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).listApps(['id']);

    expect(result.items).toHaveLength(50);
    expect(result.pagination).toEqual({
      offset: 0,
      limit: 50,
      returned: 50,
      nextOffset: 50,
      hasMore: true,
    });
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0].url).searchParams.get('$skip')).toBe('0');
    expect(new URL(requests[0].url).searchParams.get('$top')).toBe('50');
  });

  it('uses limit as total result count across pages', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      const url = new URL((request as Request).url);
      const top = Number(url.searchParams.get('$top'));
      return new Response(JSON.stringify(Array.from({length: top}, (_value, index) => ({id: `item-${requests.length}-${index}`}))), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).listApps(['id'], {
      limit: 120,
      offset: 100,
      pageSize: 50,
    });

    expect(result.items).toHaveLength(120);
    expect(result.pagination).toEqual({
      offset: 100,
      limit: 120,
      returned: 120,
      nextOffset: 220,
      hasMore: true,
    });
    expect(requests).toHaveLength(3);
    expect(requests.map(request => {
      const url = new URL(request.url);
      return [url.searchParams.get('$skip'), url.searchParams.get('$top')];
    })).toEqual([
      ['100', '50'],
      ['150', '50'],
      ['200', '20'],
    ]);
  });

  it('searchApps sends title query and sorting params', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify([{id: '93-1', name: 'my-app', title: 'My App'}]), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).searchApps('My App');

    expect(result.items).toEqual([{id: '93-1', name: 'my-app', title: 'My App'}]);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/apps');
    expect(url.searchParams.get('title')).toBe('My App');
    expect(url.searchParams.get('sort')).toBe('asc');
    expect(url.searchParams.get('fields')).toContain('title');
  });

  it('searchWorkflows requests packages with rule summaries', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify([
        {
          id: '93-1',
          name: 'my-app',
          title: 'My App',
          rules: [{id: '93-2', name: 'action', title: 'Action', type: 'action'}],
        },
      ]), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).searchWorkflows('my-app');

    expect(result).toEqual([
      {
        id: '93-1',
        name: 'my-app',
        title: 'My App',
        rules: [{id: '93-2', name: 'action', title: 'Action', type: 'action'}],
      },
    ]);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/workflows');
    expect(url.searchParams.get('query')).toBe('my-app');
    expect(url.searchParams.get('fields')).toBe('id,name,title,rules(id,name,title,type)');
  });

  it('getWorkflow requests an exact package by id or name', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify({
        id: '93-1',
        name: 'issue-email-bridge',
        title: 'Issue Email Bridge',
        rules: [{id: '93-2', name: 'action', title: 'Action', type: 'action'}],
      }), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).getWorkflow('issue-email-bridge');

    expect(result?.id).toBe('93-1');

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/workflows/issue-email-bridge');
    expect(url.searchParams.get('fields')).toBe('id,name,title,rules(id,name,title,type)');
  });

  it('getWorkflow returns null for missing packages', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({error: 'Not found'}), {status: 404, statusText: 'Not Found'});
    });

    await expect(new YouTrackAppsClient(config()).getWorkflow('missing-app')).resolves.toBeNull();
  });

  it('getAppPackage requests package files and scripts', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify({
        id: '93-1',
        name: 'my-app',
        manifestFile: {content: '{}'},
        pluggableObjects: [{id: '93-2', script: {id: '93-2', script: 'exports.httpHandler = {};'}}],
      }), {status: 200});
    });

    await expect(new YouTrackAppsClient(config()).getAppPackage('my-app')).resolves.toMatchObject({
      id: '93-1',
      manifestFile: {content: '{}'},
    });

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/apps/my-app');
    expect(url.searchParams.get('fields')).toContain('manifestFile(content)');
    expect(url.searchParams.get('fields')).toContain('script(id,name,script,updated,updatedBy(login))');
  });

  it('searchTags requests usable tags by query', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify([{id: '6-4', name: 'release', isUsable: true}]), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).searchTags('release');

    expect(result.items).toEqual([{id: '6-4', name: 'release', isUsable: true}]);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/tags');
    expect(url.searchParams.get('query')).toBe('release');
    expect(url.searchParams.get('isUsable')).toBe('true');
    expect(url.searchParams.get('fields')).toContain('tagSharingSettings');
  });

  it('searchProjectTags requests project relevant tags by query', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify([{id: '6-4', name: 'release'}]), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).searchProjectTags('0-0', 'release');

    expect(result.items).toEqual([{id: '6-4', name: 'release'}]);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/projects/0-0/relevantTags');
    expect(url.searchParams.get('query')).toBe('release');
    expect(url.searchParams.get('fields')).toContain('owner(id,login,name)');
  });

  it('getRuleLogs requests workflow rule logs with optional offset and page size', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify([
        {
          id: 'log-1',
          level: 'WARN',
          timestamp: '2026-06-26T10:00:00Z',
          username: 'admin',
          message: 'Script warning',
          stacktrace: 'stack',
        },
      ]), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).getRuleLogs('workflow-id', 'rule-id', {
      offset: 0,
      pageSize: 100,
    });

    expect(result.items).toHaveLength(1);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/workflows/workflow-id/rules/rule-id/logs');
    expect(url.searchParams.get('$skip')).toBe('0');
    expect(url.searchParams.get('$top')).toBe('100');
    expect(url.searchParams.get('fields')).toBe('id,level,timestamp,username,message,stacktrace');
  });

  it('getRuleLogs defaults to the first 50 results', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify([]), {status: 200});
    });

    const result = await new YouTrackAppsClient(config()).getRuleLogs('workflow-id', 'rule-id');

    expect(result.items).toEqual([]);

    const url = new URL(requests[0].url);
    expect(url.searchParams.get('$skip')).toBe('0');
    expect(url.searchParams.get('$top')).toBe('50');
  });

  it('reads and updates app settings endpoints', async () => {
    const requests: Request[] = [];
    const bodies: unknown[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      const req = request as Request;
      requests.push(req);
      if (req.method === 'POST') {
        bodies.push(await req.clone().json());
      }
      return new Response(JSON.stringify({id: '94-1', enabled: true, globalSettings: '{"apiUrl":"https://example.test"}'}), {
        status: 200,
      });
    });

    const client = new YouTrackAppsClient(config());
    await client.getGlobalConfig('93-1');
    await client.updateGlobalConfig('93-1', {enabled: true, globalSettings: '{"apiUrl":"https://example.test"}'});
    await client.getProjectConfiguration('0-0', '95-1');
    await client.updateProjectConfiguration('0-0', '95-1', {projectSettings: '{"projectKey":"PRJ"}'});

    expect(requests.map(request => `${request.method} ${new URL(request.url).pathname}`)).toEqual([
      'GET /api/admin/apps/93-1/globalConfig',
      'POST /api/admin/apps/93-1/globalConfig',
      'GET /api/admin/projects/0-0/appConfigurations/95-1',
      'POST /api/admin/projects/0-0/appConfigurations/95-1',
    ]);
    expect(bodies).toEqual([
      {enabled: true, globalSettings: '{"apiUrl":"https://example.test"}'},
      {projectSettings: '{"projectKey":"PRJ"}'},
    ]);
  });

  it('getProjectFields calls the issue fields schema AI tool', async () => {
    const requests: Request[] = [];
    const bodies: unknown[] = [];
    const schema = {
      type: 'object',
      properties: {
        Priority: {type: 'string', enum: ['Critical', 'Normal']},
        'Fix versions': {description: 'Array of versions', type: 'array', items: {type: 'string'}},
        'Planned for': {description: 'Array of versions', type: 'array', items: {type: 'string', enum: ['2026.1']}},
      },
      required: ['Priority'],
    };

    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      const req = request as Request;
      requests.push(req);
      bodies.push(await req.clone().json());
      return new Response(JSON.stringify({
        name: 'get_issue_fields_schema',
        content: [{text: JSON.stringify(schema), $type: 'ToolTextContent'}],
        isError: false,
        $type: 'AiToolCallResponse',
      }), {status: 200});
    });

    await expect(new YouTrackAppsClient(config()).getProjectFields('DEMO')).resolves.toEqual([
      {
        id: 'Priority',
        field: {
          id: 'Priority',
          name: 'Priority',
          fieldType: {
            isBundleType: true,
            isMultiValue: false,
            valueType: 'string',
          },
        },
        canBeEmpty: false,
      },
      {
        id: 'Fix versions',
        field: {
          id: 'Fix versions',
          name: 'Fix versions',
          fieldType: {
            isBundleType: false,
            isMultiValue: true,
            valueType: 'string',
          },
        },
        canBeEmpty: true,
      },
      {
        id: 'Planned for',
        field: {
          id: 'Planned for',
          name: 'Planned for',
          fieldType: {
            isBundleType: true,
            isMultiValue: true,
            valueType: 'string',
          },
        },
        canBeEmpty: true,
      },
    ]);

    const url = new URL(requests[0].url);
    expect(requests[0].method).toBe('POST');
    expect(url.pathname).toBe('/api/ai/tools/call');
    expect(url.searchParams.get('fields')).toBe('name,content(text),isError');
    expect(bodies[0]).toEqual({
      name: 'get_issue_fields_schema',
      arguments: {projectKey: 'DEMO'},
    });
  });

  it('getLogs parses JSON log responses', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({logs: ['first', 'second']}), {status: 200});
    });

    await expect(new YouTrackAppsClient(config()).getLogs('app-id')).resolves.toEqual({
      logs: ['first', 'second'],
    });
  });

  it('getLogs falls back to plain text log lines', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response('first line\nsecond line\n', {
        status: 200,
        headers: {'Content-Type': 'text/plain'},
      });
    });

    await expect(new YouTrackAppsClient(config()).getLogs('app-id', '20')).resolves.toEqual([
      'first line',
      'second line',
    ]);
    expect(new URL(requests[0].url).searchParams.get('$top')).toBe('20');
  });
});

function config(): Config {
  return {
    host: 'https://youtrack.example.com',
    token: 'token',
    output: null,
    overwrite: null,
    manifest: null,
    schema: null,
    open: null,
    json: false,
    yaml: false,
    yes: false,
    project: null,
    top: null,
    skip: null,
    limit: null,
    pageSize: null,
    page: null,
    offset: null,
    all: false,
    settings: null,
    enabled: null,
    cwd: process.cwd(),
  };
}
