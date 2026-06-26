import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {Config} from '../../@types/types.js';
import {createPaginationPlan, paginationFromConfig, printPaginationNotice} from './pagination.js';

describe('pagination', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps page and page size to an offset plan', () => {
    expect(createPaginationPlan({pageSize: 100, page: 3})).toEqual({
      all: false,
      limit: 100,
      offset: 200,
      pageSize: 100,
    });
  });

  it('uses limit as total result count and offset as start position', () => {
    expect(createPaginationPlan({limit: 200, offset: 100})).toEqual({
      all: false,
      limit: 200,
      offset: 100,
      pageSize: 50,
    });
  });

  it('fetches all results in 100 item chunks', () => {
    expect(createPaginationPlan({all: true})).toEqual({
      all: true,
      limit: null,
      offset: 0,
      pageSize: 100,
    });
  });

  it('keeps script log top as a compatibility page size alias', () => {
    expect(paginationFromConfig(config({skip: '0', top: '100'}), {topAlias: true})).toEqual({
      all: false,
      limit: 100,
      offset: 0,
      page: undefined,
      pageSize: 100,
    });
  });

  it('keeps script log top -1 as a compatibility all alias', () => {
    expect(paginationFromConfig(config({top: '-1'}), {topAlias: true})).toEqual({
      all: true,
      limit: undefined,
      offset: undefined,
      page: undefined,
      pageSize: undefined,
    });
  });

  it('prints page notice when the next offset aligns with page size', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    printPaginationNotice('apps', {
      items: [],
      pagination: {
        offset: 0,
        limit: 50,
        returned: 50,
        nextOffset: 50,
        hasMore: true,
      },
    });

    expect(console.log).toHaveBeenCalledWith('Showing 50 apps. Use --page 2 or --all for more.');
  });

  it('prints offset notice when the next offset does not align with page size', () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});

    printPaginationNotice('apps', {
      items: [],
      pagination: {
        offset: 100,
        limit: 120,
        returned: 120,
        nextOffset: 220,
        hasMore: true,
      },
    });

    expect(console.log).toHaveBeenCalledWith('Showing 120 apps. Use --offset 220 or --all for more.');
  });
});

function config(overrides: Partial<Config> = {}): Config {
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
    ...overrides,
  };
}
