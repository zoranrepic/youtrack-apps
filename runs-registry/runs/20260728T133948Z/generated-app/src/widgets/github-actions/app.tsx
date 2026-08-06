import React, {memo, useEffect, useState} from 'react';

const host = await YTApp.register();

type PullRequest = {idReadable?: string; title?: string; url?: string; state?: {name?: string}};

const AppComponent: React.FunctionComponent = () => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [message, setMessage] = useState('Searching pull requests containing this issue ID…');
  const entityId = YTApp.entity?.id || '';

  useEffect(() => {
    void (async () => {
      const issue = await host.fetchYouTrack(`issues/${entityId}?fields=idReadable,pullRequests(idReadable,title,url,state(name))`) as {idReadable?: string; pullRequests?: PullRequest[]};
        const issueId = issue.idReadable || entityId;
        const matches = (issue.pullRequests || []).filter(pr => (pr.title || '').includes(issueId) || Boolean(pr.idReadable));
        setPullRequests(matches);
        setMessage(matches.length ? '' : `No linked GitHub pull requests mention ${issueId}.`);
    })().catch(() => setMessage('GitHub tracking information could not be loaded.'));
  }, [entityId]);

  return <div className="widget">
    <strong>GitHub Action Tracker</strong>
    {pullRequests.map(pr => <div className="action-row" key={pr.url || pr.idReadable}>
      <a href={pr.url} target="_blank" rel="noreferrer">{pr.idReadable || 'Pull request'}: {pr.title}</a>
      <span>{pr.state?.name || 'Status pending'}</span>
    </div>)}
    {message && <span>{message}</span>}
    <small>Past GitHub workflow activity is available from the linked pull request in YouTrack.</small>
  </div>;
};

export const App = memo(AppComponent);
