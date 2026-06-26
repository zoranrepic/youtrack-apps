import {Config} from '../../../@types/types.js';
import {queryfields, QueryField} from '../../../lib/net/queryfields.js';
import {generateRequestParams, prepareErrorMessage} from '../../../lib/net/request.js';
import {resolve} from '../../../lib/net/resolve.js';
import {
  APP_RESOLVE_FIELDS,
  APP_SEARCH_FIELDS,
  APP_USAGE_UPDATE_FIELDS,
  AppDetails,
  GROUP_MEMBERS_FIELDS,
  GROUP_SEARCH_FIELDS,
  LogEntry,
  LogsResponse,
  normalizeAppId,
  PROJECT_FIELDS_FIELDS,
  PROJECT_RESOLVE_FIELDS,
  PROJECT_SEARCH_FIELDS,
  ProjectCustomField,
  ProjectDetails,
  USER_DETAILS_FIELDS,
  USER_SEARCH_FIELDS,
  UserDetails,
  UserGroup,
  UserGroupMembers,
  UserSummary,
} from '../management/types.js';

type JsonMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const LIST_PAGE_SIZE = 100;

interface JsonRequestOptions {
  fields?: QueryField;
  searchParams?: Record<string, string>;
  body?: unknown;
}

export interface ProjectConfigurationPayload {
  id: string;
  app: {id: string};
  project: {id: string};
  enabled: boolean;
}

export interface YouTrackAppsGateway {
  listApps(fields?: QueryField): Promise<AppDetails[]>;
  getApp(appName: string, fields?: QueryField): Promise<AppDetails | null>;
  listProjects(fields?: QueryField): Promise<ProjectDetails[]>;
  getProject(projectShortName: string): Promise<ProjectDetails | null>;
  getProjectFields(projectId: string): Promise<ProjectCustomField[]>;
  listGroups(): Promise<UserGroup[]>;
  getGroupMembers(groupId: string): Promise<UserGroupMembers | null>;
  listUsers(): Promise<UserSummary[]>;
  getUser(userId: string): Promise<UserDetails | null>;
  deleteWorkflow(appId: string): Promise<void>;
  updateGlobalConfig(appId: string, enabled: boolean): Promise<void>;
  updateProjectConfiguration(projectId: string, usageId: string, payload: ProjectConfigurationPayload): Promise<void>;
  updateAppUsages(appId: string, projectIds: string[]): Promise<void>;
  getLogs(appId: string, top?: string): Promise<LogEntry[] | LogsResponse | undefined>;
}

export class YouTrackAppsClient implements YouTrackAppsGateway {
  constructor(private readonly config: Config) {}

  async listApps(fields: QueryField = APP_SEARCH_FIELDS): Promise<AppDetails[]> {
    return await this.listRequest<AppDetails>('/api/admin/apps', fields);
  }

  async getApp(appName: string, fields: QueryField = APP_RESOLVE_FIELDS): Promise<AppDetails | null> {
    const app = normalizeAppId(appName);
    return await this.jsonRequest<AppDetails>('GET', `/api/admin/apps/${app}`, {fields}) ?? null;
  }

  async listProjects(fields: QueryField = PROJECT_SEARCH_FIELDS): Promise<ProjectDetails[]> {
    return await this.listRequest<ProjectDetails>('/api/admin/projects', fields);
  }

  async getProject(projectShortName: string): Promise<ProjectDetails | null> {
    return await this.jsonRequest<ProjectDetails>('GET', `/api/admin/projects/${projectShortName}`, {
      fields: PROJECT_RESOLVE_FIELDS,
    }) ?? null;
  }

  async getProjectFields(projectId: string): Promise<ProjectCustomField[]> {
    return await this.listRequest<ProjectCustomField>(`/api/admin/projects/${projectId}/fields`, PROJECT_FIELDS_FIELDS);
  }

  async listGroups(): Promise<UserGroup[]> {
    return await this.listRequest<UserGroup>('/api/groups', GROUP_SEARCH_FIELDS);
  }

  async getGroupMembers(groupId: string): Promise<UserGroupMembers | null> {
    return await this.jsonRequest<UserGroupMembers>('GET', `/api/groups/${groupId}`, {
      fields: GROUP_MEMBERS_FIELDS,
    }) ?? null;
  }

  async listUsers(): Promise<UserSummary[]> {
    return await this.listRequest<UserSummary>('/api/users', USER_SEARCH_FIELDS);
  }

  async getUser(userId: string): Promise<UserDetails | null> {
    return await this.jsonRequest<UserDetails>('GET', `/api/users/${userId}`, {
      fields: USER_DETAILS_FIELDS,
    }) ?? null;
  }

  async deleteWorkflow(appId: string): Promise<void> {
    await this.jsonRequest<void>('DELETE', `/api/admin/workflows/${appId}`);
  }

  async updateGlobalConfig(appId: string, enabled: boolean): Promise<void> {
    await this.jsonRequest<void>('PUT', `/api/admin/apps/${appId}/globalConfig`, {
      body: {enabled},
    });
  }

  async updateProjectConfiguration(projectId: string, usageId: string, payload: ProjectConfigurationPayload): Promise<void> {
    await this.jsonRequest<void>('PUT', `/api/admin/projects/${projectId}/appConfigurations/${usageId}`, {
      body: payload,
    });
  }

  async updateAppUsages(appId: string, projectIds: string[]): Promise<void> {
    await this.jsonRequest<void>('PUT', `/api/admin/apps/${appId}/usages`, {
      fields: APP_USAGE_UPDATE_FIELDS,
      body: projectIds.map(id => ({project: {id}})),
    });
  }

  async getLogs(appId: string, top?: string): Promise<LogEntry[] | LogsResponse | undefined> {
    const text = await this.textRequest('GET', `/api/admin/apps/${appId}/logs`, {
      searchParams: top ? {'$top': top} : undefined,
    });
    return parseLogsResponse(text);
  }

  private async jsonRequest<T>(
    method: JsonMethod,
    path: string,
    options: JsonRequestOptions = {},
  ): Promise<T | undefined> {
    const text = await this.textRequest(method, path, options);
    if (text === undefined) {
      return undefined;
    }

    return JSON.parse(text) as T;
  }

  private async listRequest<T>(path: string, fields: QueryField): Promise<T[]> {
    const result: T[] = [];

    for (let skip = 0; ; skip += LIST_PAGE_SIZE) {
      const page = await this.jsonRequest<T[]>('GET', path, {
        fields,
        searchParams: {
          '$skip': skip.toString(),
          '$top': LIST_PAGE_SIZE.toString(),
        },
      }) ?? [];

      result.push(...page);

      if (page.length < LIST_PAGE_SIZE) {
        return result;
      }
    }
  }

  private async textRequest(
    method: JsonMethod,
    path: string,
    options: JsonRequestOptions = {},
  ): Promise<string | undefined> {
    const url = resolve(this.config.host, path);

    if (options.fields) {
      url.searchParams.append('fields', queryfields(options.fields));
    }

    for (const [key, value] of Object.entries(options.searchParams ?? {})) {
      url.searchParams.append(key, value);
    }

    const requestParams = generateRequestParams(this.config, url.href, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const res = await fetch(requestParams);

    if (!res.ok) {
      const error = await prepareErrorMessage(res);
      throw new Error(error);
    }

    if (res.status === 204) {
      return undefined;
    }

    const text = await res.text();
    if (!text.trim()) {
      return undefined;
    }

    return text;
  }
}

function parseLogsResponse(text: string | undefined): LogEntry[] | LogsResponse | undefined {
  if (text === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(text) as LogEntry[] | LogsResponse;
  } catch {
    return text.split(/\r?\n/).map(line => line.trimEnd()).filter(Boolean);
  }
}
