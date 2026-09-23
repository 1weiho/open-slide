export type SourceTarget = { line: number; column: number };

export type ElementSummary = { tagName: string; text: string };

export type AgentSnippetEntry = SourceTarget & ElementSummary;

export type InspectorStatus =
  | { kind: 'empty' }
  | { kind: 'untraced'; tagName: string }
  | { kind: 'shared'; instances: number }
  | { kind: 'traced' };

// Mirrors the caps `current-plugin.ts` applies, so the copied snippet reads
// the same as what the agent sees in `current.json`.
const TAG_NAME_MAX = 32;
const TEXT_SNIPPET_MAX = 120;

// Normalises like the `path.join` that builds `current.json`'s pagePath.
export function sourceFilePath(slideId: string, slidesDir = 'slides'): string {
  const dir = slidesDir.replace(/\\/g, '/');
  const absolute = dir.startsWith('/');
  const parts: string[] = [];
  for (const segment of dir.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment !== '..') parts.push(segment);
    else if (parts.length && parts.at(-1) !== '..') parts.pop();
    else if (!absolute) parts.push(segment);
  }
  return `${absolute ? '/' : ''}${[...parts, slideId, 'index.tsx'].join('/')}`;
}

// `data-slide-loc` columns are Babel's 0-based ones; editors, compilers and
// agents read `path:line:col` with a 1-based column.
export function formatSourceLocation(
  slideId: string,
  target: SourceTarget,
  slidesDir?: string,
): string {
  return `${sourceFilePath(slideId, slidesDir)}:${target.line}:${target.column + 1}`;
}

export function summarizeElement(element: {
  tagName: string;
  textContent: string | null;
}): ElementSummary {
  return {
    tagName: element.tagName.toLowerCase().slice(0, TAG_NAME_MAX),
    text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, TEXT_SNIPPET_MAX),
  };
}

export function formatAgentSnippet(
  slideId: string,
  entries: AgentSnippetEntry[],
  slidesDir?: string,
): string {
  return entries
    .map((entry) => {
      const location = formatSourceLocation(slideId, entry, slidesDir);
      const element = entry.text
        ? `<${entry.tagName}>${entry.text}</${entry.tagName}>`
        : `<${entry.tagName} />`;
      return `${location} ${element}`;
    })
    .join('\n');
}

export function inspectorStatus({
  selectionCount,
  untracedTag,
  instances,
}: {
  selectionCount: number;
  untracedTag: string | null;
  instances: number;
}): InspectorStatus {
  if (selectionCount === 0) {
    return untracedTag ? { kind: 'untraced', tagName: untracedTag } : { kind: 'empty' };
  }
  if (selectionCount === 1 && instances > 1) return { kind: 'shared', instances };
  return { kind: 'traced' };
}

export function countLocInstances(
  root: Pick<ParentNode, 'querySelectorAll'> | null,
  target: SourceTarget,
): number {
  if (!root) return 0;
  return root.querySelectorAll(`[data-slide-loc="${target.line}:${target.column}"]`).length;
}

export function observeLocInstances(
  root: Node & Pick<ParentNode, 'querySelectorAll'>,
  target: SourceTarget,
  onCount: (count: number) => void,
): () => void {
  const update = () => onCount(countLocInstances(root, target));
  update();
  const observer = new MutationObserver(update);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-slide-loc'],
  });
  return () => observer.disconnect();
}
