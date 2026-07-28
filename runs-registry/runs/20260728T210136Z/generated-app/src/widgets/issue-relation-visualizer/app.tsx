import React, {memo, useEffect, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
const host = await YTApp.register();
type Link = {linkType?: {name?: string}; direction?: string; issues?: Array<{idReadable: string; summary: string}>};
const AppComponent: React.FunctionComponent = () => {
  const [links, setLinks] = useState<Link[]>([]); const [error, setError] = useState('');
  const load = async () => { try { const issue: {links?: Link[]} = await host.fetchYouTrack(`issues/${YTApp.entity?.id}?fields=idReadable,links(linkType(name),direction,issues(idReadable,summary))`); setLinks(issue.links || []); setError(''); } catch { setError('Unable to load issue links.'); } };
  useEffect(() => { void load(); }, []);
  return <div className="widget"><div className="title">Issue relation graph <Button onClick={load}>Refresh</Button></div>{error && <div className="error">{error}</div>}<div className="graph"><div className="node primary">{YTApp.entity?.id || 'Current issue'}</div>{links.length === 0 ? <span>No relations</span> : links.flatMap((link, i) => (link.issues || []).map(issue => <div className="edge" key={`${i}-${issue.idReadable}`}><span>── {link.linkType?.name || 'relates to'} ──</span><a href={`/issue/${issue.idReadable}`}>{issue.idReadable}: {issue.summary}</a></div>))}</div></div>;
};
export const App = memo(AppComponent);
