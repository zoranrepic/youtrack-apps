const entities = require('@jetbrains/youtrack-scripting-api/entities');

exports.httpHandler = {
  endpoints: [
    {
      method: 'POST',
      path: 'time-log',
      handle: function handle(ctx) {
        const payload = ctx.request.json();
        const issue = entities.Issue.findById(payload.issueId);
        const minutes = Number(payload.minutes);
        if (!issue || !issue.isVisibleTo(ctx.currentUser)) {
          ctx.response.code = 404;
          ctx.response.json({error: 'Issue not found'});
          return;
        }
        if (!Number.isInteger(minutes) || minutes < 1) {
          ctx.response.code = 400;
          ctx.response.json({error: 'Minutes must be a positive whole number'});
          return;
        }
        const workType = entities.WorkItemType.findByProject(issue.project).first();
        issue.addWorkItem({
          description: payload.description || 'Logged from Issue Operations Suite',
          date: Date.now(),
          author: ctx.currentUser,
          duration: minutes,
          type: workType
        });
        ctx.response.json({issueId: issue.idReadable, minutes: minutes, saved: true});
      }
    },
    {
      method: 'POST',
      path: 'critical-config',
      handle: function handle(ctx) {
        const payload = ctx.request.json();
        const minutes = Number(payload.criticalMinutes);
        const warning = Number(payload.warningPercent);
        if (!Number.isInteger(minutes) || minutes < 1 || !Number.isInteger(warning) || warning < 1 || warning > 100) {
          ctx.response.code = 400;
          ctx.response.json({error: 'Enter a positive critical limit and a warning percent from 1 to 100'});
          return;
        }
        ctx.globalStorage.extensionProperties.dashboardCriticalMinutes = minutes;
        ctx.globalStorage.extensionProperties.dashboardWarningPercent = warning;
        ctx.globalStorage.extensionProperties.dashboardNotificationsEnabled = payload.notificationsEnabled !== false;
        ctx.response.json({saved: true, criticalMinutes: minutes, warningPercent: warning});
      }
    },
    {
      method: 'GET',
      path: 'critical-config',
      handle: function handle(ctx) {
        ctx.response.json({
          criticalMinutes: ctx.globalStorage.extensionProperties.dashboardCriticalMinutes || ctx.settings.criticalThresholdMinutes || 480,
          warningPercent: ctx.globalStorage.extensionProperties.dashboardWarningPercent || ctx.settings.warningThresholdPercent || 80,
          notificationsEnabled: ctx.globalStorage.extensionProperties.dashboardNotificationsEnabled !== false
        });
      }
    }
  ]
};
