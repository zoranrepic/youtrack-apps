import {describe, expect, it} from '@jest/globals';
import {
  AppDetails,
  AppConfiguration,
  LogEntry,
  LogsResponse,
  AppSettingsUpdate,
  ProjectCustomField,
  ProjectDetails,
  TagDetails,
  UserDetails,
  UserGroup,
  UserGroupMembers,
  UserSummary,
} from './types.js';
import {AppManagementOperations} from './app-management-operations.js';
import {ProjectConfigurationPayload, YouTrackAppsGateway} from '../youtrack/youtrack-apps-client.js';

describe('AppManagementOperations', () => {
  it('search delegates to the app search endpoint', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      apps: [
        {id: '148-1', name: 'some-app', title: 'Workflow App'},
      ],
    }));

    const results = await operations.search('workflow');

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('148-1');
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

  it('getSettings reads global settings when no project is provided', async () => {
    const gateway = fakeGateway({
      apps: [{id: '148-1', name: 'some-app', title: 'Workflow App'}],
      globalConfig: {id: '94-1', enabled: true, globalSettings: '{"apiUrl":"https://api.example.test"}'},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getSettings('Workflow App', null);

    expect(result.id).toBe('94-1');
    expect(gateway.searchRequests).toEqual(['Workflow App']);
    expect(gateway.appRequests).toEqual(['148-1']);
    expect(gateway.globalConfigRequests).toEqual(['148-1']);
  });

  it('updateSettings writes project settings when project is provided', async () => {
    const gateway = fakeGateway();
    const operations = new AppManagementOperations(gateway);

    await operations.updateSettings('some-app', {projectSettings: '{"projectKey":"CP"}'}, 'CP');

    expect(gateway.projectConfigurationUpdates).toEqual([
      {
        projectId: '0-1',
        usageId: '184-1',
        payload: {projectSettings: '{"projectKey":"CP"}'},
      },
    ]);
  });

  it('searchTags uses project relevant tags when project is provided', async () => {
    const gateway = fakeGateway({
      tags: [{id: '6-4', name: 'release'}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.searchTags('release', 'CP');

    expect(result).toEqual([{id: '6-4', name: 'release'}]);
    expect(gateway.projectRequests).toEqual(['CP']);
    expect(gateway.projectTagRequests).toEqual([{projectId: '0-1', query: 'release'}]);
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

  it('getProjectInfo resolves exact project names and fetches details by short name', async () => {
    const gateway = fakeGateway({projects: [projectDetails()]});
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectInfo('car-project');

    expect(result.id).toBe('0-1');
    expect(gateway.projectRequests).toEqual(['CP']);
  });

  it('getProjectFields resolves any project key and fetches fields by project short name', async () => {
    const gateway = fakeGateway({
      projects: [projectDetails()],
      projectFields: [{id: 'field-1', field: {id: 'field', name: 'Priority'}, canBeEmpty: false}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectFields('0-1');

    expect(result.fields).toHaveLength(1);
    expect(gateway.projectFieldsRequests).toEqual(['CP']);
  });

  it('getGroupMembers resolves exact group names and fetches members by group id', async () => {
    const gateway = fakeGateway({
      groups: [{id: 'group-1', name: 'Developers', userCount: 2}],
      groupMembers: {ownUsers: [{id: 'user-1'}, {id: 'user-2'}]},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getGroupMembers('developers');

    expect(result.members).toEqual([{id: 'user-1'}, {id: 'user-2'}]);
    expect(gateway.groupMembersRequests).toEqual(['group-1']);
  });

  it('getUserInfo resolves exact logins and fetches details by user id', async () => {
    const gateway = fakeGateway({
      users: [{id: 'user-1', login: 'root', name: 'root'}],
      userDetails: {email: 'root@example.com', guest: false, userType: {id: 'standard'}},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getUserInfo('ROOT');

    expect(result.email).toBe('root@example.com');
    expect(gateway.userRequests).toEqual(['user-1']);
  });

  it('exact resource matching does not fall back to partial matches', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      users: [{id: 'user-1', login: 'root'}],
    }));

    await expect(operations.getUserInfo('roo')).rejects.toThrow('User "roo" was not found');
  });

  it('exact resource matching rejects ambiguous matches', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      projects: [
        {id: '0-1', name: 'Car Project', shortName: 'CP'},
        {id: '0-2', name: 'CP', shortName: 'OTHER'},
      ],
    }));

    await expect(operations.getProjectInfo('cp')).rejects.toThrow('Project "cp" is ambiguous');
  });
});

interface FakeGateway extends YouTrackAppsGateway {
  appUsageUpdates: {appId: string; projectIds: string[]}[];
  projectConfigurationUpdates: {projectId: string; usageId: string; payload: ProjectConfigurationPayload | AppSettingsUpdate}[];
  globalConfigRequests: string[];
  globalConfigUpdates: {appId: string; payload: AppSettingsUpdate}[];
  searchRequests: string[];
  appRequests: string[];
  groupMembersRequests: string[];
  projectFieldsRequests: string[];
  projectRequests: string[];
  tagRequests: string[];
  projectTagRequests: {projectId: string; query: string}[];
  userRequests: string[];
}

function fakeGateway(overrides: {
  app?: AppDetails;
  apps?: AppDetails[];
  project?: ProjectDetails;
  projects?: ProjectDetails[];
  projectFields?: ProjectCustomField[];
  groups?: UserGroup[];
  groupMembers?: UserGroupMembers;
  users?: UserSummary[];
  userDetails?: UserDetails;
  logs?: LogEntry[] | LogsResponse;
  tags?: TagDetails[];
  globalConfig?: AppConfiguration;
  projectConfig?: AppConfiguration;
} = {}): FakeGateway {
  const app = overrides.app ?? appDetails();
  const project = overrides.project ?? projectDetails();
  const gateway: FakeGateway = {
    appUsageUpdates: [],
    projectConfigurationUpdates: [],
    globalConfigRequests: [],
    globalConfigUpdates: [],
    searchRequests: [],
    appRequests: [],
    groupMembersRequests: [],
    projectFieldsRequests: [],
    projectRequests: [],
    tagRequests: [],
    projectTagRequests: [],
    userRequests: [],
    async listApps(): Promise<AppDetails[]> {
      return overrides.apps ?? [app];
    },
    async searchApps(query: string): Promise<AppDetails[]> {
      gateway.searchRequests.push(query);
      return overrides.apps ?? [app];
    },
    async getApp(appName: string): Promise<AppDetails | null> {
      gateway.appRequests.push(appName);
      return app;
    },
    async getAppPackage(): Promise<AppDetails | null> {
      return app;
    },
    async listProjects(): Promise<ProjectDetails[]> {
      return overrides.projects ?? [project];
    },
    async getProject(projectShortName: string): Promise<ProjectDetails | null> {
      gateway.projectRequests.push(projectShortName);
      return project;
    },
    async getProjectFields(projectId: string): Promise<ProjectCustomField[]> {
      gateway.projectFieldsRequests.push(projectId);
      return overrides.projectFields ?? [];
    },
    async searchTags(query: string): Promise<TagDetails[]> {
      gateway.tagRequests.push(query);
      return overrides.tags ?? [];
    },
    async searchProjectTags(projectId: string, query: string): Promise<TagDetails[]> {
      gateway.projectTagRequests.push({projectId, query});
      return overrides.tags ?? [];
    },
    async listGroups(): Promise<UserGroup[]> {
      return overrides.groups ?? [];
    },
    async getGroupMembers(groupId: string): Promise<UserGroupMembers | null> {
      gateway.groupMembersRequests.push(groupId);
      return overrides.groupMembers ?? {ownUsers: []};
    },
    async listUsers(): Promise<UserSummary[]> {
      return overrides.users ?? [];
    },
    async getUser(userId: string): Promise<UserDetails | null> {
      gateway.userRequests.push(userId);
      return overrides.userDetails ?? {email: 'user@example.com', guest: false};
    },
    async deleteWorkflow(): Promise<void> {},
    async getGlobalConfig(appId: string): Promise<AppConfiguration | null> {
      gateway.globalConfigRequests.push(appId);
      return overrides.globalConfig ?? {id: '94-1', enabled: true};
    },
    async updateGlobalConfig(appId: string, payload: AppSettingsUpdate): Promise<AppConfiguration | null> {
      gateway.globalConfigUpdates.push({appId, payload});
      return overrides.globalConfig ?? {id: '94-1', ...payload};
    },
    async getProjectConfiguration(): Promise<AppConfiguration | null> {
      return overrides.projectConfig ?? {id: '184-1', enabled: true};
    },
    async updateProjectConfiguration(
      projectId: string,
      usageId: string,
      payload: ProjectConfigurationPayload | AppSettingsUpdate,
    ): Promise<AppConfiguration | null> {
      gateway.projectConfigurationUpdates.push({projectId, usageId, payload});
      return overrides.projectConfig ?? {id: usageId};
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
