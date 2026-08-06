// Issue-scoped endpoint of the Issue Ops Suite.
//
// Backs the GitHub Action Tracker widget: finds GitHub pull requests whose title contains the
// issue ID and returns the past GitHub Actions runs of every matching pull request.
//
// To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html

const http = require('@jetbrains/youtrack-scripting-api/http');

const DEFAULT_API_BASE_URL = 'https://api.github.com';
const MAX_PULL_REQUESTS = 5;
const MAX_RUNS_PER_PULL_REQUEST = 10;
const PULL_REQUEST_PAGE_SIZE = 100;

function newConnection(ctx) {
  const baseUrl = (ctx.settings.githubApiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  const connection = new http.Connection(baseUrl);
  connection.addHeader('Accept', 'application/vnd.github+json');
  connection.addHeader('X-GitHub-Api-Version', '2022-11-28');
  if (ctx.settings.githubToken) {
    // Secret settings are usable only inside the http package.
    connection.bearerAuth(ctx.settings.githubToken);
  }
  return connection;
}

/** Query parameter values must be passed to the connection as strings. */
function toQueryParams(params) {
  return Object.keys(params).map(function(name) {
    return {name: name, value: String(params[name])};
  });
}

function describe(error) {
  if (!error) {
    return 'unknown error';
  }
  return error.message || error.localizedMessage || String(error);
}

/** Performs a GET request and returns {ok, data, code, error}. */
function getJson(connection, uri, queryParams) {
  let response;
  try {
    response = connection.getSync(uri, toQueryParams(queryParams));
  } catch (e) {
    return {ok: false, code: 0, error: 'GitHub request failed: ' + describe(e)};
  }
  if (!response || !response.isSuccess) {
    const code = response ? response.code : 0;
    const reason = response && response.exception
      ? ' (' + describe(response.exception) + ')'
      : '';
    return {ok: false, code: code, error: 'GitHub responded with HTTP ' + code + ' for ' + uri + reason};
  }
  try {
    return {ok: true, code: response.code, data: JSON.parse(response.response)};
  } catch (e) {
    return {ok: false, code: response.code, error: 'GitHub returned a malformed JSON response for ' + uri};
  }
}

function mapRun(run) {
  return {
    id: run.id,
    name: run.name,
    displayTitle: run.display_title,
    runNumber: run.run_number,
    attempt: run.run_attempt,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.head_branch,
    headSha: run.head_sha ? String(run.head_sha).substring(0, 7) : null,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    url: run.html_url
  };
}

exports.httpHandler = {
  endpoints: [
    {
      // Called from the widget as:
      // host.fetchApp('issue-backend/github-actions', {scope: true})
      method: 'GET',
      path: 'github-actions',
      scope: 'ISSUE',
      permissions: ['READ_ISSUE'],
      handle: function handle(ctx) {
        const issueId = ctx.issue.id;
        const repository = (ctx.settings.githubRepository || '').trim().replace(/^\/+|\/+$/g, '');

        if (!repository || repository.indexOf('/') < 0) {
          ctx.response.json({
            configured: false,
            issueId: issueId,
            pullRequests: [],
            message: 'Set the GitHub repository in owner/name form in the app settings to track actions.'
          });
          return;
        }

        const connection = newConnection(ctx);
        const warnings = [];

        // One call lists the pull requests; titles are matched against the issue ID locally.
        // This avoids the much stricter rate limits of the GitHub search API.
        const pulls = getJson(connection, '/repos/' + repository + '/pulls', {
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: PULL_REQUEST_PAGE_SIZE
        });
        if (!pulls.ok) {
          console.warn('GitHub pull request lookup failed for', issueId, '-', pulls.error);
          ctx.response.code = 502;
          ctx.response.json({
            configured: true,
            repository: repository,
            issueId: issueId,
            pullRequests: [],
            error: pulls.error
          });
          return;
        }

        const needle = issueId.toLowerCase();
        const matching = (pulls.data || []).filter(function(pull) {
          return pull && typeof pull.title === 'string' && pull.title.toLowerCase().indexOf(needle) >= 0;
        });
        if (matching.length > MAX_PULL_REQUESTS) {
          warnings.push('Showing the ' + MAX_PULL_REQUESTS + ' most recently updated pull requests of ' +
            matching.length + ' that reference ' + issueId + '.');
        }

        const pullRequests = [];
        matching.slice(0, MAX_PULL_REQUESTS).forEach(function(pull) {
          const branch = pull.head && pull.head.ref ? pull.head.ref : null;
          const entry = {
            number: pull.number,
            title: pull.title,
            state: pull.merged_at ? 'merged' : pull.state,
            draft: pull.draft === true,
            branch: branch,
            headSha: pull.head && pull.head.sha ? String(pull.head.sha).substring(0, 7) : null,
            author: pull.user ? pull.user.login : null,
            createdAt: pull.created_at,
            updatedAt: pull.updated_at,
            url: pull.html_url,
            actions: [],
            totalActions: 0
          };
          if (branch) {
            // Past action runs of the pull request branch, newest first.
            const runs = getJson(connection, '/repos/' + repository + '/actions/runs', {
              branch: branch,
              per_page: MAX_RUNS_PER_PULL_REQUEST
            });
            if (runs.ok) {
              const workflowRuns = runs.data && runs.data.workflow_runs ? runs.data.workflow_runs : [];
              entry.actions = workflowRuns.map(mapRun);
              entry.totalActions = runs.data && runs.data.total_count !== undefined
                ? runs.data.total_count
                : entry.actions.length;
            } else {
              warnings.push('Action runs for pull request #' + pull.number + ' are unavailable: ' + runs.error);
            }
          } else {
            warnings.push('Pull request #' + pull.number + ' has no head branch, so its runs were skipped.');
          }
          pullRequests.push(entry);
        });

        console.log('GitHub action tracker for', issueId, '- matched pull requests:', pullRequests.length);
        ctx.response.json({
          configured: true,
          repository: repository,
          issueId: issueId,
          summary: ctx.issue.summary,
          pullRequests: pullRequests,
          warnings: warnings
        });
      }
    }
  ]
};
