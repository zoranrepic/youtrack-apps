/* eslint-disable complexity, curly, no-void, react/jsx-wrap-multilines */
import React, {memo, useEffect, useState} from 'react';

const host = await YTApp.register();

type Issue = {id: string; summary?: string};

type IssueData = {id: string; summary: string; links?: Record<string, Issue[]>};

const AppComponent: React.FunctionComponent = () => {
  const [issue, setIssue] = useState<IssueData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const issueId = YTApp.entity?.id;
    if (!issueId) return;
    const load = async () => {
      try {
        const data = await host.fetchYouTrack(`issues/${issueId}`, {
          query: {fields: 'id,summary,links(direction,linkType(name),issues(id,summary))'}
        }) as IssueData;
        setIssue(data);
      } catch {
        setError('Unable to load issue relations.');
      }
    };
    void load();
  }, []);

  const relations = Object.entries(issue?.links || {});
  return <section className="widget"><h3>{'Issue Relation Visualizer'}</h3>{error && <p className="error">{error}</p>}
    {!issue && !error && <p>{'Loading relation graph…'}</p>}
    {issue && <div className="graph"><div className="node primary">{issue.id}<small>{issue.summary}</small></div>
      {relations.length === 0 ? <p>{'No linked issues.'}</p> : relations.map(([relation, items]) => <div className="relation" key={relation}><strong>{relation}</strong><div className="edges">{items.map((item) => <div className="node" key={item.id}><span>{'↔'}</span>{item.id}<small>{item.summary || 'Linked issue'}</small></div>)}</div></div>)}
    </div>}</section>;
};
export const App = memo(AppComponent);
