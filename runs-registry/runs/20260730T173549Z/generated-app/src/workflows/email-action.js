const entities = require('@jetbrains/youtrack-scripting-api/entities');
const notifications = require('@jetbrains/youtrack-scripting-api/notifications');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const MINUTES_PER_HOUR = 60;

const totalSpentMinutes = (issue) => {
  let total = 0;
  issue.workItems.forEach((workItem) => {
    total += workItem.duration || 0;
  });
  return total;
};

const parseRecipients = (value) => (value || '').split(',')
  .map((address) => address.trim())
  .filter((address) => address.length > 0);

exports.rule = entities.Issue.action({
  title: 'Send time report email',
  command: 'send-time-report-email',
  guard: (ctx) => ctx.issue.isReported,
  action: (ctx) => {
    const issue = ctx.issue;
    const recipients = parseRecipients(ctx.settings.notificationRecipients);

    if (recipients.length === 0) {
      console.warn('Email action skipped, no recipients configured', issue.id);
      workflow.message('No notification recipients are configured for the Issue Insight Suite app.');
      return;
    }

    const spentHours = Math.round((totalSpentMinutes(issue) / MINUTES_PER_HOUR) * 100) / 100;
    const body = '<div style="font-family: sans-serif">'
      + '<p>Time report for <a href="' + issue.url + '">' + issue.id + '</a> - ' + issue.summary + '</p>'
      + '<p>Total spent time: ' + spentHours + 'h</p>'
      + '<p>Current status against the critical limit: ' + (issue.extensionProperties.criticalTimeStatus || 'OK') + '</p>'
      + '<p>Sent by ' + ctx.currentUser.login + '</p>'
      + '</div>';

    notifications.sendEmail({
      fromName: ctx.currentUser.fullName,
      to: recipients,
      subject: 'Time report for ' + issue.id,
      body: body
    }, issue);

    console.log('Time report email sent for', issue.id, 'to', recipients.length, 'recipients');
    workflow.message('Time report email sent for ' + issue.id + '.');
  },
  requirements: {}
});
