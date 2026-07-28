import React, {memo, useEffect, useState} from 'react';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';

// Register widget in YouTrack. See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

type ActionRun = {
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
};

type PullRequest = {
  number: number;
  title: string;
  state: string;
  url: string;
  actions: ActionRun[];
};

type ActionsResponse = {
  configured: boolean;
  message?: string;
  repo?: string;
  issue?: string;
  error?: string;
  pullRequests?: PullRequest[];
};

function conclusionClass(run: ActionRun): string {
  if (run.status !== 'completed') {
    return 'badge running';
  }
  if (run.conclusion === 'success') {
    return 'badge success';
  }
  if (run.conclusion === 'failure' || run.conclusion === 'timed_out') {
    return 'badge failure';
  }
  return 'badge neutral';
}

const AppComponent: React.FunctionComponent = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    host.fetchApp<ActionsResponse>('github/actions', {scope: true})
      .then(response => {
        setData(response);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to reach the GitHub Action Tracker backend.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="widget"><Loader message="Loading GitHub actions…"/></div>;
  }
  if (error) {
    return <div className="widget"><span className="empty">{error}</span></div>;
  }
  if (data && !data.configured) {
    return <div className="widget"><span className="empty">{data.message}</span></div>;
  }
  if (data && data.error) {
    return <div className="widget"><span className="empty">{data.error}</span></div>;
  }

  const pullRequests = (data && data.pullRequests) || [];
  if (pullRequests.length === 0) {
    return (
      <div className="widget">
        <span className="empty">{`No pull requests in ${data?.repo} reference ${data?.issue}.`}</span>
      </div>
    );
  }

  return (
    <div className="widget">
      <div className="repo-line">{`${data?.repo} · ${data?.issue}`}</div>
      {pullRequests.map(pr => (
        <div key={pr.number} className="pr-card">
          <div className="pr-head">
            <a href={pr.url} target="_blank" rel="noreferrer">{`#${pr.number} ${pr.title}`}</a>
            <span className={`badge ${pr.state === 'open' ? 'success' : 'neutral'}`}>{pr.state}</span>
          </div>
          {pr.actions.length === 0
            ? <div className="empty">{'No recent action runs.'}</div>
            : (
              <ul className="run-list">
                {pr.actions.map((run, index) => (
                  <li key={index} className="run-row">
                    <span className={conclusionClass(run)}>{run.conclusion || run.status}</span>
                    <a href={run.url} target="_blank" rel="noreferrer">{run.name}</a>
                    <span className="run-meta">{run.event}</span>
                  </li>
                ))}
              </ul>
            )}
        </div>
      ))}
    </div>
  );
};

export const App = memo(AppComponent);
