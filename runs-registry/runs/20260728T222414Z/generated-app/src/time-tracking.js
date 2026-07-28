// Time Tracking Service
// Global HTTP handler that receives spent-time entries from the Global Time Logger
// widget and saves them to the selected issue as work items.
// Called from the widget: host.fetchApp('time-tracking/log-time', {method: 'POST', body: {...}})

const entities = require('@jetbrains/youtrack-scripting-api/entities');

function totalSpentMinutes(issue) {
  let total = 0;
  issue.workItems.forEach(function(item) {
    total += item.duration || 0;
  });
  return total;
}

exports.httpHandler = {
  endpoints: [
    {
      method: 'POST',
      path: 'log-time',
      handle: function handle(ctx) {
        const body = ctx.request.json() || {};
        const issueId = body.issueId;
        const minutes = parseInt(body.minutes, 10);
        const description = typeof body.description === 'string' ? body.description : '';

        if (!issueId) {
          ctx.response.code = 400;
          ctx.response.json({error: 'issueId is required.'});
          return;
        }
        if (isNaN(minutes) || minutes <= 0) {
          ctx.response.code = 400;
          ctx.response.json({error: 'minutes must be a positive number.'});
          return;
        }

        const issue = entities.Issue.findById(issueId);
        // Global handlers do not inherit entity visibility, so verify it explicitly.
        if (!issue || !issue.isVisibleTo(ctx.currentUser)) {
          ctx.response.code = 404;
          ctx.response.json({error: 'Issue not found or not accessible.'});
          return;
        }

        issue.addWorkItem(description, Date.now(), ctx.currentUser, minutes);

        ctx.response.json({
          ok: true,
          issue: issue.idReadable,
          loggedMinutes: minutes,
          totalMinutes: totalSpentMinutes(issue)
        });
      }
    }
  ]
};
