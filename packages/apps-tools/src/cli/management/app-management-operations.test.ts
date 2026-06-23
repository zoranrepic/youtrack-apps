import {describe, expect, it} from '@jest/globals';
import {
  AppDetails,
  LogEntry,
  LogsResponse,
  ProjectCustomField,
  ProjectDetails,
  UserDetails,
  UserGroup,
  UserGroupMembers,
  UserSummary,
} from './types.js';
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

  it('getProjectInfo resolves exact project names and fetches details by short name', async () => {
    const gateway = fakeGateway({projects: [projectDetails()]});
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectInfo('car-project');

    expect(result.id).toBe('0-1');
    expect(gateway.projectRequests).toEqual(['CP']);
  });

  it('getProjectFields resolves any project key and fetches fields by project id', async () => {
    const gateway = fakeGateway({
      projects: [projectDetails()],
      projectFields: [{id: 'field-1', field: {id: 'field', name: 'Priority'}, canBeEmpty: false}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectFields('0-1');

    expect(result.fields).toHaveLength(1);
    expect(gateway.projectFieldsRequests).toEqual(['0-1']);
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
  projectConfigurationUpdates: {projectId: string; usageId: string; payload: ProjectConfigurationPayload}[];
  groupMembersRequests: string[];
  projectFieldsRequests: string[];
  projectRequests: string[];
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
} = {}): FakeGateway {
  const app = overrides.app ?? appDetails();
  const project = overrides.project ?? projectDetails();
  const gateway: FakeGateway = {
    appUsageUpdates: [],
    projectConfigurationUpdates: [],
    groupMembersRequests: [],
    projectFieldsRequests: [],
    projectRequests: [],
    userRequests: [],
    async listApps(): Promise<AppDetails[]> {
      return overrides.apps ?? [app];
    },
    async getApp(): Promise<AppDetails | null> {
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
