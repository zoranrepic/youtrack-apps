// GitHub Action Tracker
// Issue-scoped HTTP handler. Finds GitHub pull requests that reference the current
// issue's id in their title, then returns recent GitHub Actions workflow runs for
// each of those pull requests.
// Called from the widget: host.fetchApp('github/actions', {scope: true})

const http = require('@jetbrains/youtrack-scripting-api/http');

const MAX_PRS = 5;
const MAX_RUNS = 5;

function newConnection(ctx, baseUrl) {
  const connection = new http.Connection(baseUrl);
  connection.addHeader('Accept', 'application/vnd.github+json');
  connection.addHeader('X-GitHub-Api-Version', '2022-11-28');
  // GitHub rejects requests without a User-Agent.
  connection.addHeader('User-Agent', 'YouTrack-Ops-Command-Center');
  if (ctx.settings.githubToken) {
    connection.bearerAuth(ctx.settings.githubToken);
  }
  return connection;
}

function getJson(connection, uri, queryParams) {
  const response = connection.getSync(uri, queryParams || {});
  if (!response || response.code < 200 || response.code >= 300) {
    return {ok: false, code: response ? response.code : 0, body: null};
  }
  try {
    return {ok: true, code: response.code, body: JSON.parse(response.response)};
  } catch (e) {
    return {ok: false, code: response.code, body: null};
  }
}

exports.httpHandler = {
  endpoints: [
    {
      method: 'GET',
      path: 'actions',
      scope: 'issue',
      handle: function handle(ctx) {
        const repo = ctx.settings.githubRepo;
        const apiBase = ctx.settings.githubApiBase || 'https://api.github.com';

        if (!repo || !ctx.settings.githubToken) {
          ctx.response.json({
            configured: false,
            message: 'Set the GitHub Repository and GitHub Token in the app settings.'
          });
          return;
        }

        const issueId = ctx.issue.idReadable;
        const connection = newConnection(ctx, apiBase);

        const search = getJson(connection, '/search/issues', {
          q: 'repo:' + repo + ' type:pr in:title ' + issueId
        });

        if (!search.ok) {
          ctx.response.code = 502;
          ctx.response.json({
            configured: true,
            repo: repo,
            issue: issueId,
            error: 'GitHub search failed (HTTP ' + search.code + ').'
          });
          return;
        }

        const items = (search.body && search.body.items) || [];
        const pullRequests = [];

        items.slice(0, MAX_PRS).forEach(function(item) {
          const pr = {
            number: item.number,
            title: item.title,
            state: item.state,
            url: item.html_url,
            actions: []
          };

          const detail = getJson(connection, '/repos/' + repo + '/pulls/' + item.number);
          if (detail.ok && detail.body && detail.body.head) {
            const branch = detail.body.head.ref;
            const runs = getJson(connection, '/repos/' + repo + '/actions/runs', {
              branch: branch,
              per_page: MAX_RUNS
            });
            if (runs.ok && runs.body && runs.body.workflow_runs) {
              runs.body.workflow_runs.slice(0, MAX_RUNS).forEach(function(run) {
                pr.actions.push({
                  name: run.name,
                  event: run.event,
                  status: run.status,
                  conclusion: run.conclusion,
                  url: run.html_url,
                  createdAt: run.created_at
                });
              });
            }
          }

          pullRequests.push(pr);
        });

        ctx.response.json({
          configured: true,
          repo: repo,
          issue: issueId,
          pullRequests: pullRequests
        });
      }
    }
  ]
};
