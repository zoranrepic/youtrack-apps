import {Config} from '../../@types/types.js';
import {i18n} from '../../lib/i18n/i18n.js';

export const DEFAULT_PAGE_SIZE = 50;
export const ALL_PAGE_SIZE = 100;

export interface PaginationOptions {
  all?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginationMetadata {
  offset: number;
  limit: number | null;
  returned: number;
  nextOffset: number | null;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export interface PaginationPlan {
  all: boolean;
  limit: number | null;
  offset: number;
  pageSize: number;
}

export function paginationFromConfig(config: Config, options: {topAlias?: boolean} = {}): PaginationOptions {
  const topAlias = options.topAlias && config.top !== null ? config.top : null;
  const all = config.all || topAlias === '-1';
  const top = topAlias === '-1' ? undefined : parsePositiveOption(topAlias, 'top');
  const pageSize = parsePositiveOption(config.pageSize, 'page-size') ?? top;
  const page = parsePositiveOption(config.page, 'page');
  const limit = parsePositiveOption(config.limit, 'limit') ?? top;
  const offset = parseNonNegativeOption(config.offset ?? config.skip, config.offset === null && config.skip !== null ? 'skip' : 'offset');

  if (page !== undefined && offset !== undefined) {
    throw new Error(i18n('Options "--page" and "--offset" cannot be used together'));
  }

  return {all, limit, offset, page, pageSize};
}

export function createPaginationPlan(options: PaginationOptions = {}): PaginationPlan {
  const all = options.all === true;
  const pageSize = options.pageSize ?? (all ? ALL_PAGE_SIZE : DEFAULT_PAGE_SIZE);
  const offset = options.offset ?? ((options.page ?? 1) - 1) * pageSize;
  const limit = all ? null : options.limit ?? pageSize;
  return {all, limit, offset, pageSize};
}

export function emptyPage<T>(options: PaginationOptions = {}): PaginatedResult<T> {
  const plan = createPaginationPlan(options);
  return {
    items: [],
    pagination: {
      offset: plan.offset,
      limit: plan.limit,
      returned: 0,
      nextOffset: null,
      hasMore: false,
    },
  };
}

export function printPaginationNotice(resourceName: string, result: PaginatedResult<unknown>, options: PaginationOptions = {}): void {
  if (!result.pagination.hasMore) {
    return;
  }

  const nextOffset = result.pagination.nextOffset ?? 0;
  const pageSize = createPaginationPlan(options).pageSize;
  if (nextOffset % pageSize !== 0) {
    console.log(i18n(`Showing ${result.pagination.returned} ${resourceName}. Use --offset ${nextOffset} or --all for more.`));
    return;
  }

  const nextPage = Math.floor(nextOffset / pageSize) + 1;
  console.log(i18n(`Showing ${result.pagination.returned} ${resourceName}. Use --page ${nextPage} or --all for more.`));
}

function parsePositiveOption(value: string | null, name: string): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(i18n(`Option "--${name}" should be a positive number`));
  }

  return parsed;
}

function parseNonNegativeOption(value: string | null, name: string): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(i18n(`Option "--${name}" should be a non-negative number`));
  }

  return parsed;
}
