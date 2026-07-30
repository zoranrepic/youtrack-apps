import React, {memo, useCallback, useEffect, useState} from 'react';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';
import Button from '@jetbrains/ring-ui-built/components/button/button';

const host = await YTApp.register();

type WorkflowRun = {
  id: number;
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  runNumber: number;
  createdAt: string;
  url: string;
};

type PullRequest = {
  number: number;
  title: string;
  state: string;
  author: string | null;
  url: string;
  branch: string | null;
  headSha: string | null;
  updatedAt: string;
  runs: WorkflowRun[];
};

type TrackerResponse = {
  issueId: string;
  repository: string | null;
  configured: boolean;
  pullRequests: PullRequest[];
  error?: string;
};

const conclusionColor = (run: WorkflowRun): string => {
  if (run.status !== 'completed') {
    return 'var(--ring-warning-color)';
  }
  return run.conclusion === 'success' ? 'var(--ring-success-color)' : 'var(--ring-error-color)';
};

const AppComponent: React.FunctionComponent = () => {
  const [data, setData] = useState<TrackerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await host.fetchApp<TrackerResponse>('github/github', {scope: true});
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load GitHub data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="widget"><Loader message="Loading GitHub actions..."/></div>;
  }

  if (error) {
    return <div className="widget"><span className="error">{error}</span></div>;
  }

  if (data && !data.configured) {
    return (
      <div className="widget">
        <span className="empty">
          {'No GitHub repository is configured. Set it in the Issue Insight Suite app settings.'}
        </span>
      </div>
    );
  }

  return (
    <div className="widget">
      <div className="toolbar">
        <span className="title">{`Pull requests for ${data?.issueId ?? ''} in ${data?.repository ?? ''}`}</span>
        <Button onClick={load}>{'Refresh'}</Button>
      </div>
      {(data?.pullRequests.length ?? 0) === 0
        ? <span className="empty">{'No pull requests mention this issue ID in their title.'}</span>
        : data?.pullRequests.map(pr => (
          <div className="pr" key={pr.number}>
            <div className="pr-header">
              <a href={pr.url} target="_blank" rel="noreferrer">{`#${pr.number} ${pr.title}`}</a>
              <span className="pr-meta">{`${pr.state}${pr.author ? ` - ${pr.author}` : ''}${pr.branch ? ` - ${pr.branch}` : ''}`}</span>
            </div>
            {pr.runs.length === 0
              ? <span className="empty">{'No workflow runs found for the head commit.'}</span>
              : (
                <table className="runs">
                  <thead>
                    <tr>
                      <th>{'Action'}</th>
                      <th>{'Event'}</th>
                      <th>{'Status'}</th>
                      <th>{'Started'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pr.runs.map(run => (
                      <tr key={run.id}>
                        <td><a href={run.url} target="_blank" rel="noreferrer">{`${run.name} #${run.runNumber}`}</a></td>
                        <td>{run.event}</td>
                        <td style={{color: conclusionColor(run)}}>{run.conclusion ?? run.status}</td>
                        <td>{new Date(run.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        ))}
    </div>
  );
};

export const App = memo(AppComponent);
