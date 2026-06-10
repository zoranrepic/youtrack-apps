# Rule: action

  ## Overview

  An SLA policy rule defines the set of time goals for tickets in a helpdesk project. The Issue.sla method exports an object that is interpreted as an SLA policy rule. 

  ## Anatomy

  SLA rules support the following properties:

  - `title` - A human-readable title. This title is visible in the list of SLA rules in the helpdesk project settings.
  - `guard` - The condition that determines when the SLA rule is applied to a ticket.
  - `onEnter` - The changes that should be applied to the ticket when the SLA policy starts applying to it.
  - `action` - The changes that should be applied to the ticket. 
  - `onBreach` - The changes that should be applied to the ticket when one of the SLA goals is breached. In the ctx.breachedField parameter of this function, YouTrack stores the timer custom field where the time goal has been breached for this ticket.
  - `requirements` - The list of entities that are required for the rule to execute without errors.

 ## Sample SLA Policy Rule

This SLA is applied to the tickets with the Type field set to Incident. YouTrack performs the following actions:

1. YouTrack checks the comments to the ticket and determines whether it has any comments from agents.

2. If the ticket doesn't have any comments from agents and if the SLA goals field is set to the High value, the value for the First reply field is set to 3 hours.

3. If the ticket becomes resolved, the SLA cycle ends and the First reply field is cleared.

4. When the SLA goal is breached, the responsible agent receives a notification that a high-priority ticket is overdue.


**Code**:
```js
const entities = require('@jetbrains/youtrack-scripting-api/entities');
const REPLY_TIME_IN_MIN = 3*60; //3 hours
const SLA_CALENDAR = entities.Calendar24x7.instance();

exports.rule = entities.Issue.sla({
    title: "First Reply SLA for High Priority Incidents",
    guard: (ctx) => {
        const issue = ctx.issue;
        return (issue.isReported || issue.becomesReported) && issue.fields.is(ctx.Type, ctx.Type.Incident);
    },
    onEnter: (ctx) => {
        configureBreach(ctx);
    },
    action: (ctx) => {
        const issue = ctx.issue;
        if (issue.becomesResolved) {
            issue.fields[ctx.firstReply.name] = null;
            return;
        }
        if (issue.isChanged('comments') || issue.isChanged(ctx.slaTargetField)) {
            configureBreach(ctx);
        }
    },
    onBreach: (ctx) => {
        const responsiblePerson = ctx.issue.fields.Assignee ? ctx.issue.fields.Assignee : ctx.project.owner;
        responsiblePerson.notify('First reply is overdue for the ticket {0}', ctx.issue.id,
                'Please pay attention to the {0} high-priority incident pending a reply.', ctx.issue.id, true);
    },
    requirements: {
        Type: {
            type: entities.EnumField.fieldType,
            name: "Type",
            Incident: {
                name: 'Incident'
            }
        },
        slaTargetField: {
            type: entities.EnumField.fieldType,
            name: "Priority",
            High: {
                name: "High"
            }
        },
        firstReply: {
            type: entities.Field.dateTimeType,
            name: 'First Reply'
        },
        Assignee: {
            type: entities.User.fieldType,
            name: 'Assignee'
        }
    }
});

function configureBreach(ctx) {
    const issue = ctx.issue;
    const isAgentComment = function(comment) {
        return (comment.author.login !== ctx.issue.reporter.login) && comment.isVisibleTo(ctx.issue.reporter);
    };
    const hasAgentComments = setToArray(ctx.issue.comments).some(isAgentComment);

    if (!hasAgentComments && issue.is(ctx.slaTargetField, ctx.slaTargetField.High)) {
        ctx.issue.fields[ctx.firstReply.name] = ctx.issue.afterMinutes(
                ctx.issue.created,
                REPLY_TIME_IN_MIN,
                SLA_CALENDAR,
                true
        );
    } else {
        ctx.issue.fields[ctx.firstReply.name] = null;
    }
}

function setToArray(set) {
    const arr = [];
    set.forEach(it => arr.push(it));
    return arr;
}
```