// Email Action
// User-triggered action that sends an email notification for the current issue,
// summarizing its spent time against the configured critical limit.
// Invoke via the "Send status email" command / Show more menu on an issue.

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');

function totalSpentMinutes(issue) {
  let total = 0;
  issue.workItems.forEach(function(item) {
    total += item.duration || 0;
  });
  return total;
}

exports.rule = entities.Issue.action({
  title: 'Send status email',
  command: 'send-status-email',
  guard: (ctx) => {
    return ctx.issue.isReported && !!ctx.settings.notificationEmail;
  },
  action: (ctx) => {
    const issue = ctx.issue;
    const spent = totalSpentMinutes(issue);
    const limit = ctx.settings.defaultCriticalMinutes
      ? parseInt(ctx.settings.defaultCriticalMinutes, 10)
      : null;

    const limitText = limit ? (spent >= limit ? 'CRITICAL' : 'OK') + ' (limit ' + limit + ' min)' : 'no limit configured';
    const body = '<div style="font-family: sans-serif">'
      + '<h3>' + issue.idReadable + ': ' + issue.summary + '</h3>'
      + '<p>Total spent time: <b>' + spent + ' min</b></p>'
      + '<p>Status against critical limit: <b>' + limitText + '</b></p>'
      + '<p><a href="' + issue.url + '">Open issue</a></p>'
      + '</div>';

    notifications.sendEmail({
      fromName: ctx.settings.senderName || 'Ops Command Center',
      to: [ctx.settings.notificationEmail],
      subject: 'Status for ' + issue.idReadable + ': ' + issue.summary,
      body: body
    }, issue);
  },
  requirements: {}
});
