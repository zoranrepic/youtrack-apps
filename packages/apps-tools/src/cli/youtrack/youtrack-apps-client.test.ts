import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {Config} from '../../../@types/types.js';
import {YouTrackAppsClient} from './youtrack-apps-client.js';

describe('YouTrackAppsClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe.each([
    ['apps', '/api/admin/apps', (client: YouTrackAppsClient) => client.listApps(['id'])],
    ['projects', '/api/admin/projects', (client: YouTrackAppsClient) => client.listProjects(['id'])],
    ['groups', '/api/groups', (client: YouTrackAppsClient) => client.listGroups()],
    ['users', '/api/users', (client: YouTrackAppsClient) => client.listUsers()],
  ])('list %s', (_name, path, requestList) => {
    it('uses skip/top pagination', async () => {
      const firstPage = Array.from({length: 100}, (_value, index) => ({id: `item-${index}`}));
      const secondPage = [{id: 'item-100'}];
      const requests: Request[] = [];

      jest.spyOn(global, 'fetch').mockImplementation(async request => {
        requests.push(request as Request);
        const url = new URL((request as Request).url);
        const skip = Number(url.searchParams.get('$skip') ?? '0');
        return new Response(JSON.stringify(skip === 0 ? firstPage : secondPage), {status: 200});
      });

      await expect(requestList(new YouTrackAppsClient(config()))).resolves.toHaveLength(101);

      expect(requests).toHaveLength(2);
      expect(new URL(requests[0].url).pathname).toBe(path);
      expect(new URL(requests[0].url).searchParams.get('$skip')).toBe('0');
      expect(new URL(requests[0].url).searchParams.get('$top')).toBe('100');
      expect(new URL(requests[1].url).pathname).toBe(path);
      expect(new URL(requests[1].url).searchParams.get('$skip')).toBe('100');
      expect(new URL(requests[1].url).searchParams.get('$top')).toBe('100');
    });
  });

  it('searchApps sends title query and sorting params', async () => {
    const requests: Request[] = [];
    jest.spyOn(global, 'fetch').mockImplementation(async request => {
      requests.push(request as Request);
      return new Response(JSON.stringify([{id: '93-1', name: 'my-app', title: 'My App'}]), {status: 200});
    });

    await expect(new YouTrackAppsClient(config()).searchApps('My App')).resolves.toEqual([
      {id: '93-1', name: 'my-app', title: 'My App'},
    ]);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/apps');
    expect(url.searchParams.get('title')).toBe('My App');
    expect(url.searchParams.get('sort')).toBe('asc');
    expect(url.searchParams.get('fields')).toContain('title');
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

    await expect(new YouTrackAppsClient(config()).searchTags('release')).resolves.toEqual([
      {id: '6-4', name: 'release', isUsable: true},
    ]);

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

    await expect(new YouTrackAppsClient(config()).searchProjectTags('0-0', 'release')).resolves.toEqual([
      {id: '6-4', name: 'release'},
    ]);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe('/api/admin/projects/0-0/relevantTags');
    expect(url.searchParams.get('query')).toBe('release');
    expect(url.searchParams.get('fields')).toContain('owner(id,login,name)');
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
    settings: null,
    enabled: null,
    cwd: process.cwd(),
  };
}
