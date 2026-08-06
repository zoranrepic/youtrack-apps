import React, {memo, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
const host = await YTApp.register();
type Pull = {number: number; title: string; state: string; url: string; updatedAt: string};
const AppComponent: React.FunctionComponent = () => {
  const [pulls, setPulls] = useState<Pull[]>([]); const [message, setMessage] = useState('Loading GitHub tracking…');
  const load = async () => { try { const result: {pullRequests?: Pull[]; message?: string} = await host.fetchApp('github-action-service/github-actions', {query: {issueId: YTApp.entity?.id}}); setPulls(result.pullRequests || []); setMessage(result.message || (result.pullRequests?.length ? '' : 'No pull requests mention this issue ID.')); } catch { setMessage('Unable to load GitHub actions.'); } };
  useEffect(() => { void load(); }, []);
  return <div className="widget"><div className="title">GitHub Action Tracker <Button onClick={load}>Refresh</Button></div>{message && <div>{message}</div>}{pulls.map(pr => <div className="card" key={pr.number}><a href={pr.url} target="_blank" rel="noreferrer">#{pr.number} {pr.title}</a><span className="badge">{pr.state}</span><small>Last updated {new Date(pr.updatedAt).toLocaleString()}</small></div>)}</div>;
};
export const App = memo(AppComponent);
