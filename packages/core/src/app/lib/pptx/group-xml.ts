import type { PlannedGroup } from './groups';

type XmlObject = { start: number; end: number; xml: string; name: string };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function topLevelObjects(xml: string): XmlObject[] {
  const result: XmlObject[] = [];
  const tags = /<\/?p:(sp|pic|graphicFrame|grpSp|cxnSp)\b[^>]*>/g;
  let depth = 0;
  let start = 0;
  for (const match of xml.matchAll(tags)) {
    if (match[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) {
        const end = (match.index ?? 0) + match[0].length;
        const part = xml.slice(start, end);
        const name = /<p:cNvPr\b[^>]*\bname="([^"]*)"/.exec(part)?.[1] ?? '';
        result.push({ start, end, xml: part, name });
      }
    } else {
      if (depth === 0) start = match.index ?? 0;
      depth += 1;
    }
  }
  if (depth !== 0) throw new Error('The writer produced an incomplete shape tree.');
  return result;
}

export function patchGroups(
  xml: string,
  groups: PlannedGroup[],
  expanded: Map<string, string[]>,
): string {
  let nextId =
    Math.max(
      0,
      ...Array.from(xml.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g), (match) => Number(match[1])),
    ) + 1;
  const groupedLeaves = new Map<string, string[]>();
  for (const group of groups) {
    const names = new Set(group.leaves.flatMap((id) => expanded.get(id) ?? [id]).map(escapeXml));
    const objects = topLevelObjects(xml);
    const members = objects.filter(
      (object) =>
        names.has(object.name) || groupedLeaves.get(object.name)?.every((name) => names.has(name)),
    );
    const represented = members.flatMap(
      (object) => groupedLeaves.get(object.name) ?? [object.name],
    );
    if (represented.length !== names.size || represented.some((name) => !names.has(name)))
      throw new Error(`Group ${group.id} does not cover its complete native objects.`);
    const first = members[0],
      last = members.at(-1);
    if (
      !first ||
      !last ||
      xml.slice(first.start, last.end) !== members.map((member) => member.xml).join('')
    )
      throw new Error(`Group ${group.id} would change the native paint order.`);
    const emu = (value: number) => Math.round(value * 6350);
    const x = emu(group.x),
      y = emu(group.y),
      w = Math.max(1, emu(group.w)),
      h = Math.max(1, emu(group.h));
    const name = escapeXml(group.id);
    const wrapped = `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${nextId++}" name="${name}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/><a:chOff x="${x}" y="${y}"/><a:chExt cx="${w}" cy="${h}"/></a:xfrm></p:grpSpPr>${members.map((member) => member.xml).join('')}</p:grpSp>`;
    groupedLeaves.set(name, represented);
    xml = xml.slice(0, first.start) + wrapped + xml.slice(last.end);
  }
  return xml;
}
