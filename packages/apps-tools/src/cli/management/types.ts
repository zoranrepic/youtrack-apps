import {QueryField} from '../../../lib/net/queryfields.js';

export interface AppRule {
  id?: string;
  name?: string;
  title?: string;
}

export interface AppProject {
  id?: string;
  name?: string;
  shortName?: string;
}

export interface AppUsage {
  id: string;
  enabled?: boolean;
  isBroken?: boolean;
  isActive?: boolean;
  missingRequiredSettings?: boolean;
  project?: AppProject;
}

export interface RuleProblem {
  id?: string;
  message?: string;
  fixes?: string[];
  problemKey?: string;
  global?: boolean;
}

export interface PluggableObjectUsage {
  id?: string;
  enabled?: boolean;
  isBroken?: boolean;
  problems?: RuleProblem[];
  configuration?: {
    project?: AppProject;
  };
}

export interface PluggableObject {
  id?: string;
  name?: string;
  title?: string;
  isGlobal?: boolean;
  usages?: PluggableObjectUsage[];
}

export interface RequirementError {
  message?: string;
  field?: string;
  details?: unknown;
}

export interface AppDetails {
  id: string;
  name: string;
  title?: string;
  enabled?: boolean;
  globalConfig?: {
    enabled?: boolean;
    missingRequiredSettings?: boolean;
  };
  attachedProjects?: AppProject[];
  requirements?: {
    errors?: RequirementError[];
  };
  rules?: AppRule[];
  usages?: AppUsage[];
  pluggableObjects?: PluggableObject[];
}

export interface ProjectDetails {
  id: string;
  name?: string;
  shortName?: string;
}

export type LogEntry = string | Record<string, unknown>;

export interface LogsResponse {
  logs?: LogEntry[];
  entries?: LogEntry[];
}

export interface AppProblem extends RuleProblem {
  appId: string;
  appName: string;
  pluggableObjectId?: string;
  pluggableObjectName?: string;
  projectId?: string;
  projectName?: string;
  projectShortName?: string;
}

export interface SearchResult extends AppDetails {
  matchedRules: AppRule[];
}

export interface ProjectScopeResult {
  app: AppDetails;
  project: ProjectDetails;
  projectIds: string[];
}

export interface EnabledResult {
  app: AppDetails;
  enabled: boolean;
  project?: ProjectDetails;
}

export const APP_SEARCH_FIELDS: QueryField = ['id', 'name', 'enabled', {rules: ['id', 'name', 'title']}];

export const APP_RESOLVE_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  {globalConfig: ['enabled']},
  {usages: ['id', 'enabled', 'isBroken', 'isActive', 'missingRequiredSettings', {project: ['id', 'name', 'shortName']}]},
];

export const APP_PROBLEM_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  'hasBrokenUsages',
  {usages: ['id', 'enabled', 'isBroken', 'isActive', 'missingRequiredSettings', {project: ['id', 'name', 'shortName']}]},
  {
    pluggableObjects: [
      '$type',
      'id',
      'name',
      'title',
      'isGlobal',
      {
        usages: [
          'id',
          'enabled',
          'isBroken',
          {problems: ['id', 'message', 'fixes', 'problemKey', 'global']},
          {configuration: [{project: ['id', 'name', 'shortName']}]},
          {pluggableObject: ['id']},
        ],
      },
    ],
  },
];

export const PROJECT_RESOLVE_FIELDS: QueryField = ['id', 'name', 'shortName'];

export const APP_USAGE_UPDATE_FIELDS: QueryField = [
  'id',
  'canUpdate',
  'isBroken',
  'enabled',
  'isActive',
  'missingRequiredSettings',
  {project: ['id', 'name', 'icon', 'iconUrl', 'shortName', 'template']},
];

export function normalizeAppId(app: string): string {
  return app.toString().replace(/^@/, '');
}

export function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) {
    return 'unknown';
  }
  return value ? 'yes' : 'no';
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function formatProjectLabel(project: AppProject | ProjectDetails): string {
  return project.shortName ?? project.name ?? project.id ?? 'unknown';
}

export function findUsageForProject(app: AppDetails, project: ProjectDetails): AppUsage | undefined {
  return (app.usages ?? []).find(candidate => {
    return candidate.project?.id === project.id || candidate.project?.shortName === project.shortName;
  });
}
