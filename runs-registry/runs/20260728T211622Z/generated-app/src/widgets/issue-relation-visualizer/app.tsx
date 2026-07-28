import React, {memo, useCallback, useEffect, useMemo, useState} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import Text from '@jetbrains/ring-ui-built/components/text/text';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register();

const ROOT_ISSUE_ID = YTApp.entity?.id ?? '';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 320;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;
const NODE_WIDTH = 116;
const NODE_HEIGHT = 34;
const RING_RADIUS_X = 250;
const RING_RADIUS_Y = 108;
const NODES_PER_RING = 8;

interface IssueRef {
  id: string;
  idReadable: string;
  summary: string | null;
  resolved: number | null;
}

interface IssueLink {
  direction: 'OUTWARD' | 'INWARD' | 'BOTH';
  linkType: {
    name: string;
    sourceToTarget: string;
    targetToSource: string;
  } | null;
  issues: IssueRef[];
}

interface GraphNode {
  issue: IssueRef;
  relation: string;
  direction: IssueLink['direction'];
  x: number;
  y: number;
}

const ISSUE_FIELDS = 'id,idReadable,summary,resolved';
const LINK_FIELDS =
  `direction,linkType(name,sourceToTarget,targetToSource),issues(${ISSUE_FIELDS})`;

function relationName(link: IssueLink): string {
  if (!link.linkType) {
    return 'relates to';
  }
  return link.direction === 'INWARD'
    ? link.linkType.targetToSource
    : link.linkType.sourceToTarget;
}

/** Lays the linked issues out on one or more ellipses around the focused issue. */
function layout(links: IssueLink[]): GraphNode[] {
  const flat: Omit<GraphNode, 'x' | 'y'>[] = [];
  links.forEach(link => {
    (link.issues ?? []).forEach(issue => {
      flat.push({issue, relation: relationName(link), direction: link.direction});
    });
  });

  return flat.map((node, index) => {
    const ring = Math.floor(index / NODES_PER_RING);
    const inRing = Math.min(flat.length - ring * NODES_PER_RING, NODES_PER_RING);
    const position = index % NODES_PER_RING;
    // Start at the top and spread evenly; every extra ring is pulled a bit closer to the center.
    const angle = (position / inRing) * 2 * Math.PI - Math.PI / 2 + (ring % 2 === 0 ? 0 : Math.PI / inRing);
    const shrink = 1 - ring * 0.35;
    return {
      ...node,
      x: CENTER_X + Math.cos(angle) * RING_RADIUS_X * shrink,
      y: CENTER_Y + Math.sin(angle) * RING_RADIUS_Y * shrink
    };
  });
}

function arrowFor(direction: IssueLink['direction']): string {
  if (direction === 'OUTWARD') {
    return '→';
  }
  return direction === 'INWARD' ? '←' : '↔';
}

const AppComponent: React.FunctionComponent = () => {
  const [focusId, setFocusId] = useState<string>(ROOT_ISSUE_ID);
  const [focusIssue, setFocusIssue] = useState<IssueRef | null>(null);
  const [links, setLinks] = useState<IssueLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) {
      setLoading(false);
      setError('This widget must be opened from an issue.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      host.fetchYouTrack<IssueRef>(`issues/${focusId}?fields=${ISSUE_FIELDS}`),
      host.fetchYouTrack<IssueLink[]>(`issues/${focusId}/links?fields=${LINK_FIELDS}`)
    ]).then(([issue, issueLinks]) => {
      if (cancelled) {
        return;
      }
      setFocusIssue(issue);
      setLinks((issueLinks ?? []).filter(link => (link.issues ?? []).length > 0));
      setLoading(false);
    }).catch((e: Error) => {
      if (cancelled) {
        return;
      }
      setError(e.message || 'Failed to load the issue relations.');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [focusId]);

  const nodes = useMemo(() => layout(links), [links]);

  const focusOn = useCallback((id: string) => {
    setFocusId(id);
  }, []);

  const resetFocus = useCallback(() => {
    setFocusId(ROOT_ISSUE_ID);
  }, []);

  const focusLabel = focusIssue?.idReadable ?? focusId;

  return (
    <div className="widget">
      <div className="relations-header">
        <Text bold>{'Issue relations'}</Text>
        {loading && <LoaderInline/>}
        {!loading && !error && (
          <Text info>
            {nodes.length > 0
              ? `${nodes.length} linked issue(s) in ${links.length} relation type(s)`
              : 'No links for this issue yet'}
          </Text>
        )}
        {focusId !== ROOT_ISSUE_ID && (
          <Button onClick={resetFocus}>{`Back to ${ROOT_ISSUE_ID}`}</Button>
        )}
      </div>

      {error && <Text info>{error}</Text>}

      {!error && (
        <svg
          className="relations-graph"
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          width="100%"
          height={CANVAS_HEIGHT}
          role="img"
          aria-label={`Relations of ${focusLabel}`}
        >
          {nodes.map(node => (
            <line
              key={`edge-${node.issue.id}-${node.relation}`}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={node.x}
              y2={node.y}
              className="relations-edge"
            />
          ))}
          {nodes.map(node => {
            const midX = (CENTER_X + node.x) / 2;
            const midY = (CENTER_Y + node.y) / 2;
            return (
              <text
                key={`label-${node.issue.id}-${node.relation}`}
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                className="relations-edge-label"
              >
                {`${arrowFor(node.direction)} ${node.relation}`}
              </text>
            );
          })}

          <g className="relations-node relations-node_focused">
            <rect
              x={CENTER_X - NODE_WIDTH / 2}
              y={CENTER_Y - NODE_HEIGHT / 2}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={6}
            />
            <text x={CENTER_X} y={CENTER_Y + 4} textAnchor="middle">{focusLabel}</text>
            <title>{focusIssue?.summary ?? focusLabel}</title>
          </g>

          {nodes.map(node => (
            <g
              key={`node-${node.issue.id}-${node.relation}`}
              className={
                node.issue.resolved
                  ? 'relations-node relations-node_resolved'
                  : 'relations-node'
              }
              onClick={() => focusOn(node.issue.idReadable)}
              role="button"
              tabIndex={0}
              onKeyPress={event => {
                if (event.key === 'Enter') {
                  focusOn(node.issue.idReadable);
                }
              }}
            >
              <rect
                x={node.x - NODE_WIDTH / 2}
                y={node.y - NODE_HEIGHT / 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={6}
              />
              <text x={node.x} y={node.y + 4} textAnchor="middle">{node.issue.idReadable}</text>
              <title>{`${node.issue.idReadable}: ${node.issue.summary ?? ''}`}</title>
            </g>
          ))}
        </svg>
      )}

      {!error && nodes.length > 0 && (
        <Text info>{'Click a linked issue to explore its own relations.'}</Text>
      )}
    </div>
  );
};


export const App = memo(AppComponent);
