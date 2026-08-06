import React, {memo, useCallback, useEffect, useState} from 'react';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';
import Button from '@jetbrains/ring-ui-built/components/button/button';

const host = await YTApp.register();

type LinkedIssue = {
  idReadable: string;
  summary: string;
  resolved: number | null;
};

type IssueLink = {
  direction: string;
  linkType: {name: string; sourceToTarget: string; targetToSource: string};
  issues: LinkedIssue[];
};

type IssueWithLinks = {
  idReadable: string;
  summary: string;
  links: IssueLink[];
};

type GraphNode = {
  id: string;
  summary: string;
  relation: string;
  resolved: boolean;
  x: number;
  y: number;
};

const WIDTH = 640;
const HEIGHT = 340;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS_X = 240;
const RADIUS_Y = 130;

const relationName = (link: IssueLink): string => {
  if (link.direction === 'INWARD') {
    return link.linkType.targetToSource || link.linkType.name;
  }
  return link.linkType.sourceToTarget || link.linkType.name;
};

const buildNodes = (issue: IssueWithLinks): GraphNode[] => {
  const flat: Omit<GraphNode, 'x' | 'y'>[] = [];
  (issue.links || []).forEach(link => {
    (link.issues || []).forEach(linked => {
      flat.push({
        id: linked.idReadable,
        summary: linked.summary,
        relation: relationName(link),
        resolved: Boolean(linked.resolved)
      });
    });
  });

  return flat.map((node, index) => {
    const angle = (2 * Math.PI * index) / Math.max(flat.length, 1) - Math.PI / 2;
    return {
      ...node,
      x: CENTER_X + RADIUS_X * Math.cos(angle),
      y: CENTER_Y + RADIUS_Y * Math.sin(angle)
    };
  });
};

const AppComponent: React.FunctionComponent = () => {
  const [issue, setIssue] = useState<IssueWithLinks | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fields = 'idReadable,summary,links(direction,linkType(name,sourceToTarget,targetToSource),'
        + 'issues(idReadable,summary,resolved))';
      const result = await host.fetchYouTrack<IssueWithLinks>(
        `issues/${YTApp.entity?.id}`,
        {query: {fields}}
      );
      setIssue(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load issue relations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="widget"><Loader message="Loading relations..."/></div>;
  }

  if (error) {
    return <div className="widget"><span className="error">{error}</span></div>;
  }

  const nodes = issue ? buildNodes(issue) : [];

  return (
    <div className="widget">
      <div className="toolbar">
        <span className="title">{`Relations of ${issue?.idReadable ?? ''}`}</span>
        <Button onClick={load}>{'Refresh'}</Button>
      </div>
      {nodes.length === 0
        ? <span className="empty">{'This issue has no links to other issues.'}</span>
        : (
          <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Issue relation graph">
            {nodes.map(node => (
              <line
                key={`edge-${node.id}-${node.relation}`}
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={node.x}
                y2={node.y}
                stroke="var(--ring-borders-color)"
                strokeWidth={1}
              />
            ))}
            {nodes.map(node => (
              <text
                key={`label-${node.id}-${node.relation}`}
                x={(CENTER_X + node.x) / 2}
                y={(CENTER_Y + node.y) / 2 - 4}
                textAnchor="middle"
                fontSize={10}
                fill="var(--ring-secondary-color)"
              >{node.relation}</text>
            ))}
            {nodes.map(node => (
              <g key={`node-${node.id}-${node.relation}`}>
                <circle cx={node.x} cy={node.y} r={26} fill="var(--ring-content-background-color)" stroke="var(--ring-main-color)"/>
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--ring-link-color)"
                  style={{cursor: 'pointer', textDecoration: node.resolved ? 'line-through' : 'none'}}
                  onClick={() => window.open(`../../issue/${node.id}`, '_blank')}
                >{node.id}</text>
              </g>
            ))}
            <circle cx={CENTER_X} cy={CENTER_Y} r={32} fill="var(--ring-main-color)"/>
            <text x={CENTER_X} y={CENTER_Y + 4} textAnchor="middle" fontSize={11} fill="#fff">
              {issue?.idReadable}
            </text>
          </svg>
        )}
      <ul className="legend">
        {nodes.map(node => (
          <li key={`legend-${node.id}-${node.relation}`}>
            <b>{node.relation}</b>{` ${node.id} - ${node.summary}`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const App = memo(AppComponent);
