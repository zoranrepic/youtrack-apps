import React, {memo, useEffect, useState} from 'react';

const host = await YTApp.register();

type LinkedIssue = {idReadable: string; summary: string};
type Link = {linkType: {name: string}; issues: LinkedIssue[]};

const AppComponent: React.FunctionComponent = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [message, setMessage] = useState('Loading issue relations…');
  const entityId = YTApp.entity?.id || '';

  useEffect(() => {
    void (async () => {
      const issue = await host.fetchYouTrack(`issues/${entityId}?fields=idReadable,summary,links(linkType(name),issues(idReadable,summary))`) as {links?: Link[]};
        setLinks(issue.links || []);
        setMessage(issue.links?.length ? '' : 'No linked issues yet.');
    })().catch(() => setMessage('Relations could not be loaded.'));
  }, [entityId]);

  return <div className="widget graph">
    <div className="graph-center">{entityId}</div>
    {links.map((link, index) => <div className="relation" key={`${link.linkType.name}-${index}`}>
      <strong>{link.linkType.name}</strong>
      {link.issues.map(issue => <span className="node" key={issue.idReadable}>{issue.idReadable}: {issue.summary}</span>)}
    </div>)}
    {message && <span>{message}</span>}
  </div>;
};

export const App = memo(AppComponent);
