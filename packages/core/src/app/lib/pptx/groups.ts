import type { PptxDiagnostic, PptxGroup, PptxObject, PptxPage, PptxRect } from './model';

export type PlannedGroup = PptxGroup & PptxRect & { leaves: string[] };

function diagnostic(
  page: PptxPage,
  group: Partial<PptxGroup>,
  code: string,
  message: string,
  error = false,
): PptxDiagnostic {
  return {
    severity: error ? 'error' : 'warning',
    code,
    page: page.index + 1,
    source: group.source || page.id,
    message,
    suggestion: error
      ? 'Provide unique group IDs and a tree of existing members.'
      : 'Keep the separate native objects, or mark a contiguous group without tables.',
  };
}

export function validateGroups(page: PptxPage): PptxDiagnostic[] {
  if (page.groups === undefined) return [];
  if (!Array.isArray(page.groups))
    return [diagnostic(page, {}, 'invalid-groups', 'Groups must be an array.', true)];
  const diagnostics: PptxDiagnostic[] = [];
  const ids = new Set(page.objects.map((object) => object.id));
  ids.add(page.id);
  const groups = new Map<string, PptxGroup>();
  for (const group of page.groups) {
    if (
      !group ||
      typeof group.id !== 'string' ||
      !group.id.trim() ||
      /[<>&"']/.test(group.id) ||
      Array.from(group.id).some(
        (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      ) ||
      ids.has(group.id) ||
      typeof group.source !== 'string' ||
      !group.source.trim() ||
      !['source', 'explicit'].includes(group.kind) ||
      !Array.isArray(group.members) ||
      !group.members.length ||
      group.members.some((id) => typeof id !== 'string' || !id)
    ) {
      diagnostics.push(
        diagnostic(
          page,
          group || {},
          'invalid-group',
          'A group has an invalid or duplicate ID, source, kind or member list.',
          true,
        ),
      );
      continue;
    }
    ids.add(group.id);
    groups.set(group.id, group);
  }
  const parents = new Map<string, string>();
  for (const group of groups.values()) {
    for (const member of group.members) {
      if (!ids.has(member) || member === page.id || parents.has(member))
        diagnostics.push(
          diagnostic(
            page,
            group,
            'invalid-group-member',
            `Group ${group.id} has a missing or repeated member ${member}.`,
            true,
          ),
        );
      else parents.set(member, group.id);
    }
  }
  for (const group of groups.values()) {
    const seen = new Set<string>();
    let current: string | undefined = group.id;
    while (current) {
      if (seen.has(current)) {
        diagnostics.push(
          diagnostic(page, group, 'cyclic-group', `Group ${group.id} contains a cycle.`, true),
        );
        break;
      }
      seen.add(current);
      current = parents.get(current);
    }
  }
  return diagnostics;
}

function bounds(objects: PptxObject[]): PptxRect {
  const rects = objects.map((object) => {
    const angle = ((object.rotation ?? 0) * Math.PI) / 180;
    const w = Math.abs(Math.cos(angle) * object.w) + Math.abs(Math.sin(angle) * object.h);
    const h = Math.abs(Math.sin(angle) * object.w) + Math.abs(Math.cos(angle) * object.h);
    return { x: object.x + (object.w - w) / 2, y: object.y + (object.h - h) / 2, w, h };
  });
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  return {
    x,
    y,
    w: Math.max(...rects.map((rect) => rect.x + rect.w)) - x,
    h: Math.max(...rects.map((rect) => rect.y + rect.h)) - y,
  };
}

export function planGroups(page: PptxPage): {
  groups: PlannedGroup[];
  diagnostics: PptxDiagnostic[];
} {
  const diagnostics = validateGroups(page);
  if (diagnostics.length) return { groups: [], diagnostics };
  const definitions = new Map((page.groups ?? []).map((group) => [group.id, group]));
  const objects = [...page.objects].sort((a, b) => a.order - b.order);
  const positions = new Map(objects.map((object, index) => [object.id, index]));
  const groups: PlannedGroup[] = [];
  const resolved = new Map<string, string[]>();
  const visit = (group: PptxGroup): string[] => {
    const cached = resolved.get(group.id);
    if (cached) return cached;
    const leaves = group.members
      .flatMap((id) => {
        const child = definitions.get(id);
        return child ? visit(child) : [id];
      })
      .sort((a, b) => (positions.get(a) ?? 0) - (positions.get(b) ?? 0));
    resolved.set(group.id, leaves);
    const children = leaves.map((id) => objects[positions.get(id) ?? -1]).filter(Boolean);
    const interval =
      (positions.get(leaves.at(-1) ?? '') ?? -1) - (positions.get(leaves[0]) ?? 0) + 1;
    const rect = bounds(children);
    const reason = children.some((object) => object.kind === 'table')
      ? 'table'
      : interval !== leaves.length
        ? 'paint-order'
        : leaves.length < 2 ||
            ![rect.x, rect.y, rect.w, rect.h].every(Number.isFinite) ||
            rect.w <= 0 ||
            rect.h <= 0
          ? 'bounds'
          : undefined;
    if (reason)
      diagnostics.push(
        diagnostic(
          page,
          group,
          `group-skipped-${reason}`,
          `The ${group.kind} group remains as separate native objects (${reason}).`,
        ),
      );
    else groups.push({ ...group, ...rect, leaves });
    return leaves;
  };
  for (const group of definitions.values()) visit(group);
  return { groups, diagnostics };
}

export function extractGroups(
  root: Element,
  page: PptxPage,
  sources: Map<string, Element>,
): PptxGroup[] {
  const groups: PptxGroup[] = [];
  const sourceObjects = new Map<string, PptxObject[]>();
  for (const object of page.objects) {
    const id = object.sourceId ?? object.source;
    const members = sourceObjects.get(id) ?? [];
    members.push(object);
    sourceObjects.set(id, members);
  }
  const representatives = new Map<string, string>();
  const owner = new Map<string, Element>();
  const add = (source: string, kind: PptxGroup['kind'], members: string[], element: Element) => {
    const id = `p${page.index + 1}-g${groups.length + 1}`;
    groups.push({ id, source, kind, members });
    owner.set(id, element);
    return id;
  };
  for (const objects of sourceObjects.values()) {
    const element = sources.get(objects[0].source);
    if (!element) continue;
    const representative =
      objects.length > 1
        ? add(
            objects[0].source,
            'source',
            objects.map((object) => object.id),
            element,
          )
        : objects[0].id;
    owner.set(representative, element);
    representatives.set(representative, representative);
  }
  const containers = [...root.querySelectorAll('[data-osd-pptx-group]')];
  if (root.hasAttribute('data-osd-pptx-group')) containers.unshift(root);
  for (const container of containers.reverse()) {
    const members = [...representatives.keys()].filter((id) => {
      const element = owner.get(id);
      return element && container.contains(element);
    });
    if (members.length < 2) continue;
    const source =
      page.objects.find((object) => sources.get(object.source) === container)?.source ??
      `group:${container.getAttribute('data-osd-pptx-group') || container.localName}`;
    const id = add(source, 'explicit', members, container);
    for (const member of members) representatives.delete(member);
    representatives.set(id, id);
  }
  return groups;
}
