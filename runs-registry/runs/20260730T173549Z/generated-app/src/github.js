const http = require('@jetbrains/youtrack-scripting-api/http');

const GITHUB_API = 'https://api.github.com';
const MAX_PULL_REQUESTS = 5;
const MAX_RUNS_PER_PR = 10;

const newConnection = (ctx) => {
  const connection = new http.Connection(GITHUB_API);
  connection.addHeader('Accept', 'application/vnd.github+json');
  connection.addHeader('X-GitHub-Api-Version', '2022-11-28');
  if (ctx.settings.githubToken) {
    connection.bearerAuth(ctx.settings.githubToken);
  }
  return connection;
};

const getJson = (connection, path, params) => {
  const response = connection.getSync(path, params || {});
  if (!response || response.code !== 200) {
    console.warn('GitHub request failed', path, response && response.code);
    return null;
  }
  try {
    return JSON.parse(response.response);
  } catch (e) {
    console.warn('GitHub response is not valid JSON', path, e.message);
    return null;
  }
};

exports.httpHandler = {
  endpoints: [
    {
      // GitHub Action Tracker: pull requests that mention the issue ID plus their past workflow runs.
      method: 'GET',
      path: 'github',
      scope: 'ISSUE',
      handle: (ctx) => {
        const issueId = ctx.issue.id;
        const repository = ctx.settings.githubRepository;

        if (!repository) {
          ctx.response.json({issueId: issueId, repository: null, configured: false, pullRequests: []});
          return;
        }

        const connection = newConnection(ctx);
        const search = getJson(connection, '/search/issues', {
          q: 'repo:' + repository + ' is:pr in:title ' + issueId,
          per_page: String(MAX_PULL_REQUESTS)
        });

        if (!search) {
          ctx.response.code = 502;
          ctx.response.json({error: 'Unable to read pull requests from GitHub', issueId: issueId, repository: repository});
          return;
        }

        const items = (search.items || []).slice(0, MAX_PULL_REQUESTS);
        const pullRequests = items.map((item) => {
          const details = getJson(connection, '/repos/' + repository + '/pulls/' + item.number);
          const headSha = details && details.head ? details.head.sha : null;
          let runs = [];

          if (headSha) {
            const runsResponse = getJson(connection, '/repos/' + repository + '/actions/runs', {
              head_sha: headSha,
              per_page: String(MAX_RUNS_PER_PR)
            });
            runs = ((runsResponse && runsResponse.workflow_runs) || []).map((run) => ({
              id: run.id,
              name: run.name,
              event: run.event,
              status: run.status,
              conclusion: run.conclusion,
              runNumber: run.run_number,
              createdAt: run.created_at,
              url: run.html_url
            }));
          }

          return {
            number: item.number,
            title: item.title,
            state: details && details.merged_at ? 'merged' : item.state,
            author: item.user ? item.user.login : null,
            url: item.html_url,
            branch: details && details.head ? details.head.ref : null,
            headSha: headSha,
            updatedAt: item.updated_at,
            runs: runs
          };
        });

        console.log('GitHub tracker resolved', pullRequests.length, 'pull requests for', issueId);
        ctx.response.json({
          issueId: issueId,
          repository: repository,
          configured: true,
          pullRequests: pullRequests
        });
      }
    }
  ]
};
