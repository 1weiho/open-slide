import * as t from '@babel/types';
import { parseSource, walkAll, walkJsx } from './babel-walk.ts';
import {
  type ApplyEditResult,
  findImports,
  findJsxAttr,
  formatJsxAttrValue,
  type ImportInfo,
  readJsxStringAttr,
  type Splice,
  spliceRange,
} from './edit-ops.ts';

type ImgSrcUse = { element: t.JSXElement; identNode: t.Identifier };

function collectImgSrcUses(ast: t.File, identifier: string): ImgSrcUse[] {
  const uses: ImgSrcUse[] = [];
  walkJsx(ast, (n) => {
    if (!t.isJSXElement(n)) return;
    const opening = n.openingElement;
    if (!t.isJSXIdentifier(opening.name) || opening.name.name !== 'img') return;
    const src = findJsxAttr(opening, 'src');
    if (!src?.value) return;
    if (!t.isJSXExpressionContainer(src.value)) return;
    const expr = src.value.expression;
    if (!t.isIdentifier(expr) || expr.name !== identifier) return;
    uses.push({ element: n, identNode: expr });
  });
  return uses;
}

function readStyleNumericDim(opening: t.JSXOpeningElement, key: 'width' | 'height'): number | null {
  const style = findJsxAttr(opening, 'style');
  if (!style?.value) return null;
  if (!t.isJSXExpressionContainer(style.value)) return null;
  const obj = style.value.expression;
  if (!t.isObjectExpression(obj)) return null;
  for (const prop of obj.properties) {
    if (!t.isObjectProperty(prop)) continue;
    if (prop.computed) continue;
    const k = prop.key;
    const keyName = t.isIdentifier(k) ? k.name : t.isStringLiteral(k) ? k.value : null;
    if (keyName !== key) continue;
    const v = prop.value;
    if (t.isNumericLiteral(v) && Number.isFinite(v.value)) return v.value;
    return null;
  }
  return null;
}

function buildPlaceholderReplacement(
  hint: string,
  width: number | null,
  height: number | null,
): string {
  const parts: string[] = [`hint=${formatJsxAttrValue(hint)}`];
  if (width != null) parts.push(`width={${width}}`);
  if (height != null) parts.push(`height={${height}}`);
  return `<ImagePlaceholder ${parts.join(' ')} />`;
}

function planEnsureImagePlaceholderImport(ast: t.File): Splice | null {
  const readKind = (n: t.ImportDeclaration | t.ImportSpecifier) => n.importKind === 'type';
  const imports = findImports(ast);
  let valueImport: ImportInfo | null = null;
  for (const imp of imports) {
    if (imp.source !== '@open-slide/core') continue;
    const declIsTypeOnly = readKind(imp.node);
    for (const spec of imp.node.specifiers) {
      if (!t.isImportSpecifier(spec)) continue;
      const imported = spec.imported;
      const name = t.isIdentifier(imported) ? imported.name : imported.value;
      if (name !== 'ImagePlaceholder') continue;
      const specIsTypeOnly = readKind(spec) || declIsTypeOnly;
      if (!specIsTypeOnly) return null;
    }
    if (!declIsTypeOnly && !valueImport) valueImport = imp;
  }
  if (valueImport) {
    const node = valueImport.node;
    const lastSpec = node.specifiers[node.specifiers.length - 1];
    if (lastSpec && t.isImportSpecifier(lastSpec)) {
      const insertAt = lastSpec.end ?? 0;
      return { from: insertAt, to: insertAt, text: ', ImagePlaceholder' };
    }
    if (lastSpec && t.isImportDefaultSpecifier(lastSpec)) {
      const insertAt = lastSpec.end ?? 0;
      return { from: insertAt, to: insertAt, text: ', { ImagePlaceholder }' };
    }
    const insertAt = (node.source.start ?? 0) - 'from '.length;
    return { from: insertAt, to: insertAt, text: '{ ImagePlaceholder } ' };
  }
  return {
    from: 0,
    to: 0,
    text: "import { ImagePlaceholder } from '@open-slide/core';\n",
  };
}

export function findAssetUsages(source: string, assetPath: string): number {
  const ast = parseSource(source);
  if (!ast) return 0;
  const imports = findImports(ast);
  const target = imports.find((imp) => imp.source === assetPath && imp.defaultIdent);
  if (!target?.defaultIdent) return 0;
  return collectImgSrcUses(ast, target.defaultIdent).length;
}

export function findReferencedAssets(source: string, assetPaths: readonly string[]): Set<string> {
  const referenced = new Set<string>();
  if (assetPaths.length === 0) return referenced;
  const ast = parseSource(source);
  if (!ast) return referenced;
  const wanted = new Set(assetPaths);
  const identToPath = new Map<string, string>();
  const importLocals = new Set<t.Identifier>();
  for (const imp of findImports(ast)) {
    if (!imp.defaultIdent) continue;
    if (!wanted.has(imp.source)) continue;
    identToPath.set(imp.defaultIdent, imp.source);
    for (const spec of imp.node.specifiers) {
      if (t.isImportDefaultSpecifier(spec) && spec.local.name === imp.defaultIdent) {
        importLocals.add(spec.local);
      }
    }
  }
  if (identToPath.size === 0) return referenced;
  walkAll(ast, (n) => {
    if (!t.isIdentifier(n)) return;
    const p = identToPath.get(n.name);
    if (!p) return;
    if (importLocals.has(n)) return;
    referenced.add(p);
  });
  return referenced;
}

export function applyRevertAsset(source: string, assetPath: string): ApplyEditResult {
  const ast = parseSource(source);
  if (!ast) return { ok: false, status: 422, error: 'could not parse source' };

  const imports = findImports(ast);
  const target = imports.find((imp) => imp.source === assetPath && imp.defaultIdent);
  if (!target?.defaultIdent) return { ok: true, source };
  const identifier = target.defaultIdent;

  const importLocal = (() => {
    for (const spec of target.node.specifiers) {
      if (t.isImportDefaultSpecifier(spec) && spec.local.name === identifier) return spec.local;
    }
    return null;
  })();

  const imgUses = collectImgSrcUses(ast, identifier);
  const allowed = new Set<t.Identifier>(imgUses.map((u) => u.identNode));
  if (importLocal) allowed.add(importLocal);

  let foreign = false;
  walkAll(ast, (n) => {
    if (!t.isIdentifier(n) || n.name !== identifier) return;
    if (!allowed.has(n)) foreign = true;
  });
  if (foreign) {
    return {
      ok: false,
      status: 422,
      error: `cannot revert: '${identifier}' is referenced outside <img src={${identifier}}>`,
    };
  }

  const splices: Splice[] = [];

  for (const use of imgUses) {
    const opening = use.element.openingElement;
    const hint = readJsxStringAttr(opening, 'alt') ?? '';
    const width = readStyleNumericDim(opening, 'width');
    const height = readStyleNumericDim(opening, 'height');
    splices.push(spliceRange(use.element, buildPlaceholderReplacement(hint, width, height)));
  }

  const importNode = target.node;
  const importFrom = importNode.start ?? 0;
  let importTo = importNode.end ?? 0;
  if (source[importTo] === '\n') importTo += 1;
  splices.push({ from: importFrom, to: importTo, text: '' });

  const ensureSplice = planEnsureImagePlaceholderImport(ast);
  if (ensureSplice) splices.push(ensureSplice);

  if (splices.length === 0) return { ok: true, source };

  splices.sort((a, b) => b.from - a.from);
  let next = source;
  for (const sp of splices) {
    next = next.slice(0, sp.from) + sp.text + next.slice(sp.to);
  }
  if (!parseSource(next)) {
    return { ok: false, status: 422, error: 'edit would produce invalid source' };
  }
  return { ok: true, source: next };
}
