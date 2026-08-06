// To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html

const http = require('@jetbrains/youtrack-scripting-api/http');

exports.httpHandler = {endpoints: [{
  method: 'GET', path: 'github-actions',
  handle: function(ctx) {
    const issueId = ctx.request.getParameter('issueId');
    const repository = ctx.settings.githubRepository;
    if (!repository || !issueId) {
      ctx.response.json({configured: false, pullRequests: [], message: 'Set GitHub repository in app settings to enable tracking.'});
      return;
    }
    const connection = new http.Connection('https://api.github.com');
    connection.addHeader('Accept', 'application/vnd.github+json');
    connection.addHeader('User-Agent', 'YouTrack-Issue-Operations-Hub');
    if (ctx.settings.githubToken) connection.bearerAuth(ctx.settings.githubToken);
    const response = connection.getSync('/repos/' + repository + '/pulls?state=all&per_page=100', '');
    if (!response || response.code !== 200) {
      ctx.response.json({configured: true, pullRequests: [], message: 'GitHub request failed (' + (response ? response.code : 'no response') + ').'});
      return;
    }
    const pullRequests = response.json().filter(function(pr) { return pr.title.indexOf(issueId) !== -1; }).map(function(pr) {
      return {number: pr.number, title: pr.title, state: pr.state, url: pr.html_url, updatedAt: pr.updated_at};
    });
    ctx.response.json({configured: true, repository: repository, pullRequests: pullRequests});
  }
}]};
