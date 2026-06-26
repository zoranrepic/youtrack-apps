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
const PROJECT_FIELDS_TOOL_CALL_FIELDS: QueryField = ['name', {content: ['text']}, 'isError'];

interface JsonRequestOptions {
  fields?: QueryField;
  searchParams?: Record<string, string>;
  body?: unknown;
}

interface ToolCallResponse {
  name?: string;
  content?: {text?: string}[];
  isError?: boolean;
}

interface IssueFieldsSchema {
  type?: string;
  properties?: Record<string, IssueFieldSchema>;
  required?: unknown[];
}

interface IssueFieldSchema {
  type?: unknown;
  enum?: unknown[];
  items?: IssueFieldSchema;
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
  getProjectFields(projectKey: string): Promise<ProjectCustomField[]>;
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

  async getProjectFields(projectKey: string): Promise<ProjectCustomField[]> {
    const response = await this.jsonRequest<ToolCallResponse>('POST', '/api/ai/tools/call', {
      fields: PROJECT_FIELDS_TOOL_CALL_FIELDS,
      body: {
        name: 'get_issue_fields_schema',
        arguments: {projectKey},
      },
    });

    return parseProjectFieldsToolResponse(response);
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

function parseProjectFieldsToolResponse(response: ToolCallResponse | undefined): ProjectCustomField[] {
  const text = response?.content
    ?.map(item => item.text)
    .filter((item): item is string => typeof item === 'string')
    .join('\n')
    .trim();

  if (response?.isError) {
    throw new Error(text || 'Failed to fetch project fields schema');
  }

  if (!text) {
    return [];
  }

  const data = parseJsonText(text);
  if (Array.isArray(data)) {
    return data as ProjectCustomField[];
  }

  if (isRecord(data) && Array.isArray(data.fields)) {
    return data.fields as ProjectCustomField[];
  }

  if (isIssueFieldsSchema(data)) {
    return projectFieldsFromSchema(data);
  }

  return [];
}

function projectFieldsFromSchema(schema: IssueFieldsSchema): ProjectCustomField[] {
  const requiredFields = new Set(schema.required?.filter((item): item is string => typeof item === 'string'));
  return Object.entries(schema.properties ?? {}).map(([name, property]) => {
    return {
      id: name,
      field: {
        id: name,
        name,
        fieldType: {
          isBundleType: hasEnum(property),
          isMultiValue: property.type === 'array',
          valueType: valueType(property),
        },
      },
      canBeEmpty: !requiredFields.has(name),
    };
  });
}

function hasEnum(property: IssueFieldSchema): boolean {
  return Array.isArray(property.enum) || Array.isArray(property.items?.enum);
}

function valueType(property: IssueFieldSchema): string {
  if (property.type === 'array') {
    return typeof property.items?.type === 'string' ? property.items.type : 'array';
  }

  return typeof property.type === 'string' ? property.type : 'unknown';
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fencedJson) {
      return JSON.parse(fencedJson[1]);
    }

    const firstJsonStart = Math.min(...[text.indexOf('{'), text.indexOf('[')].filter(index => index >= 0));
    const lastJsonEnd = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (Number.isFinite(firstJsonStart) && lastJsonEnd > firstJsonStart) {
      return JSON.parse(text.slice(firstJsonStart, lastJsonEnd + 1));
    }

    throw new Error('Project fields schema response is not valid JSON');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIssueFieldsSchema(value: unknown): value is IssueFieldsSchema {
  return isRecord(value) && isRecord(value.properties);
}
