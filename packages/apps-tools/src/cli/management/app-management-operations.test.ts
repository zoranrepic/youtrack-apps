import {describe, expect, it} from '@jest/globals';
import {AppDetails, LogEntry, LogsResponse, ProjectDetails} from './types.js';
import {AppManagementOperations} from './app-management-operations.js';
import {ProjectConfigurationPayload, YouTrackAppsGateway} from '../youtrack/youtrack-apps-client.js';

describe('AppManagementOperations', () => {
  it('search matches app names and rule metadata', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      apps: [
        {id: '148-1', name: 'some-app', rules: [{id: 'on-change', title: 'Workflow Change'}]},
        {id: '148-2', name: 'other-app', rules: [{id: 'timer', title: 'Timer'}]},
      ],
    }));

    const results = await operations.search('workflow');

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('148-1');
    expect(results[0].matchedRules).toEqual([{id: 'on-change', title: 'Workflow Change'}]);
  });

  it('setEnabled builds a project configuration update payload', async () => {
    const gateway = fakeGateway();
    const operations = new AppManagementOperations(gateway);

    const result = await operations.setEnabled('some-app', false, 'CP');

    expect(result.project?.id).toBe('0-1');
    expect(gateway.projectConfigurationUpdates).toEqual([
      {
        projectId: '0-1',
        usageId: '184-1',
        payload: {
          id: '184-1',
          app: {id: '148-1'},
          project: {id: '0-1'},
          enabled: false,
        },
      },
    ]);
  });

  it('setProjectScope updates app usages from resolved project ids', async () => {
    const gateway = fakeGateway({app: appDetails({usages: []})});
    const operations = new AppManagementOperations(gateway);

    const result = await operations.setProjectScope('some-app', 'CP', 'attach');

    expect(result.projectIds).toEqual(['0-1']);
    expect(gateway.appUsageUpdates).toEqual([{appId: '148-1', projectIds: ['0-1']}]);
  });

  it('getLogs normalizes an empty response to an empty list', async () => {
    const operations = new AppManagementOperations(fakeGateway({logs: undefined}));

    await expect(operations.getLogs('some-app', null)).resolves.toEqual([]);
  });
});

interface FakeGateway extends YouTrackAppsGateway {
  appUsageUpdates: {appId: string; projectIds: string[]}[];
  projectConfigurationUpdates: {projectId: string; usageId: string; payload: ProjectConfigurationPayload}[];
}

function fakeGateway(overrides: {
  app?: AppDetails;
  apps?: AppDetails[];
  project?: ProjectDetails;
  logs?: LogEntry[] | LogsResponse;
} = {}): FakeGateway {
  const app = overrides.app ?? appDetails();
  const project = overrides.project ?? projectDetails();
  const gateway: FakeGateway = {
    appUsageUpdates: [],
    projectConfigurationUpdates: [],
    async listApps(): Promise<AppDetails[]> {
      return overrides.apps ?? [app];
    },
    async getApp(): Promise<AppDetails | null> {
      return app;
    },
    async getProject(): Promise<ProjectDetails | null> {
      return project;
    },
    async deleteWorkflow(): Promise<void> {},
    async updateGlobalConfig(): Promise<void> {},
    async updateProjectConfiguration(projectId: string, usageId: string, payload: ProjectConfigurationPayload): Promise<void> {
      gateway.projectConfigurationUpdates.push({projectId, usageId, payload});
    },
    async updateAppUsages(appId: string, projectIds: string[]): Promise<void> {
      gateway.appUsageUpdates.push({appId, projectIds});
    },
    async getLogs(): Promise<LogEntry[] | LogsResponse | undefined> {
      return overrides.logs;
    },
  };

  return gateway;
}

function appDetails(overrides: Partial<AppDetails> = {}): AppDetails {
  return {
    id: '148-1',
    name: 'some-app',
    usages: [
      {
        id: '184-1',
        project: projectDetails(),
      },
    ],
    ...overrides,
  };
}

function projectDetails(): ProjectDetails {
  return {
    id: '0-1',
    name: 'Car-Project',
    shortName: 'CP',
  };
}
