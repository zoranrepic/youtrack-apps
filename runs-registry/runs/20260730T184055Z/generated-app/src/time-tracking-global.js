/* eslint-disable @typescript-eslint/no-require-imports, complexity, no-magic-numbers, no-console */
const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.httpHandler = {
  endpoints: [
    {
      method: 'POST',
      path: 'time-entry',
      scope: 'GLOBAL',
      permissions: ['UPDATE_ISSUE'],
      handle: (ctx) => {
        const entry = ctx.request.json();
        const issueId = entry && entry.issueId;
        const minutes = Number(entry && entry.minutes);
        const description = String((entry && entry.description) || 'Logged with Issue Delivery Control Center').trim();
        const issue = issueId && entities.Issue.findById(issueId);

        if (!issue || !issue.isVisibleTo(ctx.currentUser)) {
          ctx.response.code = 404;
          ctx.response.json({error: 'Issue not found or not visible.'});
          return;
        }
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
          ctx.response.code = 400;
          ctx.response.json({error: 'Minutes must be an integer between 1 and 1440.'});
          return;
        }

        const workItemType = entities.WorkItemType.findByProject(issue.project).first();
        if (!workItemType) {
          ctx.response.code = 400;
          ctx.response.json({error: 'The issue project has no available work-item type.'});
          return;
        }

        issue.addWorkItem({
          description,
          date: Date.now(),
          author: ctx.currentUser,
          duration: minutes,
          type: workItemType
        });
        console.info('Logged work item', issue.id, minutes);
        ctx.response.json({issueId: issue.id, minutes, status: 'saved'});
      }
    }
  ]
};
