/* eslint-disable complexity, curly, no-void, react/jsx-wrap-multilines */
import React, {memo, useEffect, useState} from 'react';

const host = await YTApp.register();
type PullRequest = {id: string; number?: number; title?: string; state?: string; url?: string; updated?: number; branch?: string};

const AppComponent: React.FunctionComponent = () => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const issueId = YTApp.entity?.id;
    if (!issueId) return;
    const load = async () => {
      try {
        const issue = await host.fetchYouTrack(`issues/${issueId}`, {
          query: {fields: 'id,pullRequests(id,number,title,state,url,updated,branch)'}
        }) as {pullRequests?: PullRequest[]};
        setPullRequests((issue.pullRequests || []).filter((pr) => (pr.title || '').includes(issueId)));
      } catch {
        setError('Unable to load linked pull requests.');
      }
    };
    void load();
  }, []);

  return <section className="widget"><h3>{'GitHub Action Tracker'}</h3><p className="hint">{'Pull requests linked to this issue whose title includes the issue ID, with their latest tracked status.'}</p>
    {error && <p className="error">{error}</p>}
    {!error && pullRequests.length === 0 && <p>{'No linked pull requests found.'}</p>}
    {pullRequests.map((pr) => <article className="card" key={pr.id}><div><strong>{pr.number ? `#${pr.number}` : pr.id}</strong>{' '}{pr.title || 'Pull request'}</div><span className={`status ${String(pr.state || 'unknown').toLowerCase()}`}>{pr.state || 'Unknown'}</span><small>{pr.branch ? `Branch: ${pr.branch}` : 'No branch details'}{pr.updated ? ` · Last tracked: ${new Date(pr.updated).toLocaleString()}` : ''}</small>{pr.url && <a href={pr.url} target="_blank" rel="noreferrer">{'Open pull request'}</a>}</article>)}
  </section>;
};
export const App = memo(AppComponent);
