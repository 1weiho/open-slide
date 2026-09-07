import fs from 'node:fs/promises';
import path from 'node:path';
import { validateMutationRequest } from '@open-slide/shared/http';
import { json, readBody } from '@open-slide/shared/vite';
import { parse } from 'svelte/compiler';
import type { Plugin } from 'vite';

type ElementNode = {
  type: string;
  name: string;
  name_loc: {
    start: { line: number; column: number };
    end: { character: number };
  };
  attributes?: AttributeNode[];
  fragment?: { nodes?: FragmentNode[] };
  start: number;
  end: number;
};

type FragmentNode = {
  type: string;
  name?: string;
  start: number;
  end: number;
};

type AttributeNode = {
  type: string;
  name?: string;
  start: number;
  end: number;
  value?: true | Array<{ type: string; data?: string; start: number; end: number }>;
};

export type SvelteElementEdit = {
  line: number;
  column: number;
  text?: string;
  styles?: Record<string, string | null>;
  assetPath?: string;
};

type Replacement = { start: number; end: number; value: string };

function findElement(
  value: unknown,
  line: number,
  column: number,
  seen = new Set<object>(),
): ElementNode | null {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findElement(child, line, column, seen);
      if (found) return found;
    }
    return null;
  }
  const node = value as Record<string, unknown>;
  if (node.type === 'RegularElement' || node.type === 'Component') {
    const element = node as unknown as ElementNode;
    if (element.name_loc.start.line === line && element.name_loc.start.column === column) {
      return element;
    }
  }
  for (const child of Object.values(node)) {
    const found = findElement(child, line, column, seen);
    if (found) return found;
  }
  return null;
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\{/g, '&#123;');
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\{/g, '&#123;');
}

function parseStyle(value: string): Map<string, string> {
  const styles = new Map<string, string>();
  for (const declaration of value.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const key = declaration.slice(0, colon).trim();
    const styleValue = declaration.slice(colon + 1).trim();
    if (key && styleValue) styles.set(key, styleValue);
  }
  return styles;
}

function serializeStyle(styles: Map<string, string>): string {
  return [...styles].map(([key, value]) => `${key}: ${value}`).join('; ');
}

function literalAttribute(element: ElementNode, name: string, source: string): string | null {
  const attribute = element.attributes?.find(
    (candidate) => candidate.type === 'Attribute' && candidate.name === name,
  );
  if (!attribute || !Array.isArray(attribute.value)) return null;
  if (attribute.value.some((part) => part.type !== 'Text')) return null;
  return attribute.value.map((part) => part.data ?? source.slice(part.start, part.end)).join('');
}

function numericAttribute(element: ElementNode, name: string, source: string): string | null {
  const attribute = element.attributes?.find(
    (candidate) => candidate.type === 'Attribute' && candidate.name === name,
  );
  if (!attribute) return null;
  return source.slice(attribute.start, attribute.end).match(/=\{?(\d+(?:\.\d+)?)\}?$/)?.[1] ?? null;
}

function assetIdentifier(assetPath: string, source: string): string {
  const filename =
    assetPath
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ?? 'asset';
  const base =
    filename
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, character: string) => character.toUpperCase())
      .replace(/^[^a-zA-Z_$]+/, '') || 'asset';
  let identifier = base;
  let index = 2;
  while (new RegExp(`\\b${identifier}\\b`).test(source)) identifier = `${base}${index++}`;
  return identifier;
}

export function applySvelteElementEdit(
  source: string,
  edit: SvelteElementEdit,
): { ok: true; source: string } | { ok: false; error: string } {
  const ast = parse(source, { modern: true });
  const element = findElement(ast.fragment, edit.line, edit.column);
  if (!element) return { ok: false, error: 'element not found' };
  const replacements: Replacement[] = [];

  if (edit.assetPath) {
    if (!edit.assetPath.startsWith('./assets/') && !edit.assetPath.startsWith('@assets/')) {
      return { ok: false, error: 'asset path must start with ./assets/ or @assets/' };
    }
    if (element.type !== 'Component' || element.name !== 'ImagePlaceholder') {
      return { ok: false, error: 'target is not an ImagePlaceholder' };
    }
    const identifier = assetIdentifier(edit.assetPath, source);
    const hint = literalAttribute(element, 'hint', source) ?? '';
    const width = numericAttribute(element, 'width', source);
    const height = numericAttribute(element, 'height', source);
    const dimensions = [
      width ? `width: ${width}px` : null,
      height ? `height: ${height}px` : null,
      'object-fit: contain',
    ].filter(Boolean);
    replacements.push({
      start: element.start,
      end: element.end,
      value: `<img src={${identifier}} alt="${escapeAttribute(hint)}" style="${dimensions.join('; ')}" />`,
    });
    const script = source.match(/<script(?:\s[^>]*)?>/);
    const importStatement = `import ${identifier} from '${edit.assetPath}';`;
    if (script?.index !== undefined) {
      const offset = script.index + script[0].length;
      replacements.push({ start: offset, end: offset, value: `\n${importStatement}` });
    } else {
      replacements.push({
        start: 0,
        end: 0,
        value: `<script>\n${importStatement}\n</script>\n\n`,
      });
    }
  }

  if (typeof edit.text === 'string') {
    if (element.type !== 'RegularElement') {
      return { ok: false, error: 'element text is not directly editable' };
    }
    const nodes = element.fragment?.nodes ?? [];
    if (
      nodes.length === 0 ||
      nodes.some(
        (node) => node.type !== 'Text' && !(node.type === 'RegularElement' && node.name === 'br'),
      )
    ) {
      return { ok: false, error: 'element text is not directly editable' };
    }
    replacements.push({
      start: nodes[0].start,
      end: nodes.at(-1)?.end ?? nodes[0].end,
      value: escapeText(edit.text),
    });
  }

  if (edit.styles && Object.keys(edit.styles).length > 0) {
    if (element.type !== 'RegularElement') {
      return { ok: false, error: 'component styles are not directly editable' };
    }
    const styleAttribute = element.attributes?.find(
      (attribute) => attribute.type === 'Attribute' && attribute.name === 'style',
    );
    if (styleAttribute && !Array.isArray(styleAttribute.value)) {
      return { ok: false, error: 'dynamic style attributes are not directly editable' };
    }
    const styleParts = Array.isArray(styleAttribute?.value) ? styleAttribute.value : [];
    if (styleParts.some((part) => part.type !== 'Text')) {
      return { ok: false, error: 'dynamic style attributes are not directly editable' };
    }
    const currentStyle = styleParts
      .map((part) => part.data ?? source.slice(part.start, part.end))
      .join('');
    const styles = parseStyle(currentStyle ?? '');
    for (const [key, value] of Object.entries(edit.styles)) {
      if (value === null || !value.trim()) styles.delete(key);
      else styles.set(key, value.trim());
    }
    const serialized = serializeStyle(styles);
    if (styleAttribute) {
      replacements.push({
        start:
          !serialized && /\s/.test(source[styleAttribute.start - 1] ?? '')
            ? styleAttribute.start - 1
            : styleAttribute.start,
        end: styleAttribute.end,
        value: serialized ? `style="${escapeAttribute(serialized)}"` : '',
      });
    } else if (serialized) {
      replacements.push({
        start: element.name_loc.end.character,
        end: element.name_loc.end.character,
        value: ` style="${escapeAttribute(serialized)}"`,
      });
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  let updated = source;
  for (const replacement of replacements) {
    updated =
      updated.slice(0, replacement.start) + replacement.value + updated.slice(replacement.end);
  }
  return { ok: true, source: updated };
}

export function svelteEditPlugin(options: { slidesRoot: string }): Plugin {
  const slidesRoot = path.resolve(options.slidesRoot);
  return {
    name: 'open-slide:svelte-edit',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__svelte-edit', async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://local');
        if (request.method !== 'PUT' || url.pathname !== '/') return next();
        const requestCheck = validateMutationRequest(request, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(response, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(request)) as {
          file?: unknown;
          line?: unknown;
          column?: unknown;
          text?: unknown;
          styles?: unknown;
          assetPath?: unknown;
        };
        if (
          typeof body.file !== 'string' ||
          !body.file.endsWith('.svelte') ||
          !Number.isInteger(body.line) ||
          !Number.isInteger(body.column) ||
          (typeof body.text !== 'string' &&
            (!body.styles || typeof body.styles !== 'object' || Array.isArray(body.styles)) &&
            typeof body.assetPath !== 'string') ||
          (body.styles &&
            typeof body.styles === 'object' &&
            Object.values(body.styles).some((value) => value !== null && typeof value !== 'string'))
        ) {
          return json(response, 400, { error: 'invalid edit' });
        }
        const file = path.resolve(slidesRoot, body.file);
        const relative = path.relative(slidesRoot, file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          return json(response, 400, { error: 'invalid file' });
        }
        try {
          const source = await fs.readFile(file, 'utf8');
          const result = applySvelteElementEdit(source, {
            line: body.line as number,
            column: body.column as number,
            text: typeof body.text === 'string' ? body.text : undefined,
            styles: body.styles as Record<string, string | null> | undefined,
            assetPath: typeof body.assetPath === 'string' ? body.assetPath : undefined,
          });
          if (!result.ok) return json(response, 422, { error: result.error });
          const changed = result.source !== source;
          if (changed) await fs.writeFile(file, result.source, 'utf8');
          return json(response, 200, { ok: true, changed });
        } catch (error) {
          return json(response, 500, { error: String((error as Error).message ?? error) });
        }
      });
    },
  };
}
