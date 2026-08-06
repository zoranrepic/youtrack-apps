// To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html

const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.httpHandler = {endpoints: [{
  method: 'POST', path: 'time-entries',
  handle: function(ctx) {
    const issueId = ctx.request.getParameter('issueId');
    const minutes = parseInt(ctx.request.getParameter('minutes'), 10);
    const description = ctx.request.getParameter('description') || 'Logged from Issue Operations Hub';
    const limit = parseInt(ctx.request.getParameter('limitMinutes'), 10);
    const issue = entities.Issue.findById(issueId);
    if (!issue) {
      ctx.response.json({ok: false, message: 'Provide a valid issue ID.'});
      return;
    }
    if (!isNaN(limit) && limit > 0) issue.extensionProperties.criticalTimeLimitMinutes = limit;
    if (ctx.request.getParameter('configureOnly') === 'true') {
      ctx.response.json({ok: !isNaN(limit) && limit > 0, issueId: issue.id, limitMinutes: issue.extensionProperties.criticalTimeLimitMinutes || null, message: 'Provide a positive threshold.'});
      return;
    }
    if (!minutes || minutes < 1) {
      ctx.response.json({ok: false, message: 'Provide a positive number of minutes.'});
      return;
    }
    issue.addWorkItem(description, Date.now(), ctx.currentUser, minutes, null);
    ctx.response.json({ok: true, issueId: issue.id, minutes: minutes, limitMinutes: issue.extensionProperties.criticalTimeLimitMinutes || null});
  }
}]};
