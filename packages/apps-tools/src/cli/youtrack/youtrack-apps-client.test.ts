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
    ['project fields', '/api/admin/projects/project-id/fields', (client: YouTrackAppsClient) => client.getProjectFields('project-id')],
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
    cwd: process.cwd(),
  };
}
