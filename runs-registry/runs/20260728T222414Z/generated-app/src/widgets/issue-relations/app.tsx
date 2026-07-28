import React, {memo, useEffect, useState} from 'react';
import Loader from '@jetbrains/ring-ui-built/components/loader/loader';

// Register widget in YouTrack. See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

type LinkedIssue = {
  idReadable: string;
  summary: string;
  resolved: number | null;
};

type IssueLink = {
  direction: 'OUTWARD' | 'INWARD' | 'BOTH';
  linkType: {
    name: string;
    sourceToTarget: string;
    targetToSource: string;
  };
  issues: LinkedIssue[];
};

type GraphNode = {
  idReadable: string;
  summary: string;
  resolved: boolean;
  relation: string;
  x: number;
  y: number;
};

const WIDTH = 560;
const HEIGHT = 380;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS = 140;

function relationLabel(link: IssueLink): string {
  return link.direction === 'INWARD' ? link.linkType.targetToSource : link.linkType.sourceToTarget;
}

const AppComponent: React.FunctionComponent = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);

  useEffect(() => {
    const issueId = YTApp.entity?.id;
    if (!issueId) {
      setError('No issue context available.');
      setLoading(false);
      return;
    }

    const fields = 'direction,linkType(name,sourceToTarget,targetToSource),issues(idReadable,summary,resolved)';
    host.fetchYouTrack<IssueLink[]>(`issues/${issueId}/links?fields=${fields}`)
      .then(links => {
        const related: Omit<GraphNode, 'x' | 'y'>[] = [];
        (links || []).forEach(link => {
          const label = relationLabel(link);
          (link.issues || []).forEach(linked => {
            related.push({
              idReadable: linked.idReadable,
              summary: linked.summary,
              resolved: Boolean(linked.resolved),
              relation: label
            });
          });
        });

        const positioned: GraphNode[] = related.map((node, index) => {
          const angle = (2 * Math.PI * index) / Math.max(related.length, 1);
          return {
            ...node,
            x: CENTER_X + RADIUS * Math.cos(angle),
            y: CENTER_Y + RADIUS * Math.sin(angle)
          };
        });
        setNodes(positioned);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load issue relations.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="widget"><Loader message="Loading relations…"/></div>;
  }
  if (error) {
    return <div className="widget"><span className="empty">{error}</span></div>;
  }
  if (nodes.length === 0) {
    return <div className="widget"><span className="empty">{'This issue has no linked issues.'}</span></div>;
  }

  return (
    <div className="widget">
      <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Issue relations graph">
        {nodes.map(node => (
          <line
            key={`edge-${node.idReadable}`}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={node.x}
            y2={node.y}
            className="edge"
          />
        ))}
        {nodes.map(node => (
          <text
            key={`label-${node.idReadable}`}
            x={(CENTER_X + node.x) / 2}
            y={(CENTER_Y + node.y) / 2 - 4}
            className="edge-label"
            textAnchor="middle"
          >
            {node.relation}
          </text>
        ))}
        {nodes.map(node => (
          <g
            key={`node-${node.idReadable}`}
            className="node"
            onClick={() => host.fetchYouTrack(`issues/${node.idReadable}`).catch(() => undefined)}
          >
            <circle cx={node.x} cy={node.y} r={26} className={node.resolved ? 'node-circle resolved' : 'node-circle'}/>
            <title>{node.summary}</title>
            <text x={node.x} y={node.y + 4} textAnchor="middle" className="node-label">{node.idReadable}</text>
          </g>
        ))}
        <circle cx={CENTER_X} cy={CENTER_Y} r={34} className="node-circle center"/>
        <text x={CENTER_X} y={CENTER_Y + 4} textAnchor="middle" className="node-label center-label">
          {YTApp.entity?.id ? 'This issue' : ''}
        </text>
      </svg>
    </div>
  );
};

export const App = memo(AppComponent);
