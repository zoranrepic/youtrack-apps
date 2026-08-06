import React, {memo, useCallback, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Text from '@jetbrains/ring-ui-built/components/text/text';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

interface ActionRun {
  id: number;
  name: string | null;
  displayTitle: string | null;
  runNumber: number | null;
  attempt: number | null;
  event: string | null;
  status: string | null;
  conclusion: string | null;
  branch: string | null;
  headSha: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  url: string | null;
}

interface PullRequest {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  branch: string | null;
  headSha: string | null;
  author: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  url: string | null;
  actions: ActionRun[];
  totalActions: number;
}

interface TrackerResponse {
  configured: boolean;
  repository?: string;
  issueId?: string;
  summary?: string;
  pullRequests: PullRequest[];
  warnings?: string[];
  message?: string;
  error?: string;
}

/** Maps a run to a coloured status label. */
function runStatus(run: ActionRun): {label: string; className: string} {
  if (run.status !== 'completed') {
    return {label: run.status ?? 'unknown', className: 'gh-status gh-status_progress'};
  }
  switch (run.conclusion) {
    case 'success':
      return {label: 'success', className: 'gh-status gh-status_success'};
    case 'failure':
    case 'timed_out':
    case 'startup_failure':
      return {label: run.conclusion, className: 'gh-status gh-status_failure'};
    case 'cancelled':
    case 'skipped':
    case 'stale':
    case 'neutral':
      return {label: run.conclusion, className: 'gh-status gh-status_neutral'};
    default:
      return {label: run.conclusion ?? 'completed', className: 'gh-status gh-status_neutral'};
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

const AppComponent: React.FunctionComponent = () => {
  const [data, setData] = useState<TrackerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    host.fetchApp<TrackerResponse>('issue-backend/github-actions', {scope: true})
      .then(response => {
        setData(response);
        setError(response?.error ?? null);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message || 'Failed to load the GitHub actions.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pullRequests = data?.pullRequests ?? [];

  return (
    <div className="widget">
      <div className="gh-header">
        <Text bold>{'GitHub actions'}</Text>
        {data?.repository && <Text info>{data.repository}</Text>}
        {loading && <LoaderInline/>}
        <Button onClick={load} disabled={loading}>{'Refresh'}</Button>
      </div>

      {error && <Text info>{`Error: ${error}`}</Text>}
      {!loading && data && !data.configured && <Text info>{data.message}</Text>}

      {(data?.warnings ?? []).map(warning => (
        <Text info key={warning}>{warning}</Text>
      ))}

      {!loading && !error && data?.configured && pullRequests.length === 0 && (
        <Text info>
          {`No pull request in ${data.repository} has ${data.issueId} in its title.`}
        </Text>
      )}

      {pullRequests.map(pull => (
        <div className="gh-pull" key={pull.number}>
          <div className="gh-pull__title">
            <a href={pull.url ?? undefined} target="_blank" rel="noreferrer">
              {`#${pull.number}`}
            </a>
            <Text bold>{pull.title}</Text>
            <span className={`gh-state gh-state_${pull.state}`}>
              {pull.draft ? `${pull.state} · draft` : pull.state}
            </span>
          </div>
          <Text info>
            {[
              pull.author ? `by ${pull.author}` : null,
              pull.branch ? `branch ${pull.branch}` : null,
              pull.headSha ? `head ${pull.headSha}` : null,
              pull.updatedAt ? `updated ${formatDate(pull.updatedAt)}` : null
            ].filter(Boolean).join(' · ')}
          </Text>

          {pull.actions.length === 0 && <Text info>{'No action runs found for this branch.'}</Text>}

          {pull.actions.length > 0 && (
            <table className="gh-runs">
              <thead>
                <tr>
                  <th>{'Workflow'}</th>
                  <th>{'Run'}</th>
                  <th>{'Event'}</th>
                  <th>{'Status'}</th>
                  <th>{'Started'}</th>
                </tr>
              </thead>
              <tbody>
                {pull.actions.map(run => {
                  const status = runStatus(run);
                  return (
                    <tr key={run.id}>
                      <td>
                        <a href={run.url ?? undefined} target="_blank" rel="noreferrer">
                          {run.name ?? run.displayTitle ?? String(run.id)}
                        </a>
                      </td>
                      <td>{run.runNumber ? `#${run.runNumber}.${run.attempt ?? 1}` : ''}</td>
                      <td>{run.event}</td>
                      <td><span className={status.className}>{status.label}</span></td>
                      <td>{formatDate(run.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {pull.totalActions > pull.actions.length && (
            <Text info>{`Showing ${pull.actions.length} of ${pull.totalActions} runs.`}</Text>
          )}
        </div>
      ))}
    </div>
  );
};


export const App = memo(AppComponent);
