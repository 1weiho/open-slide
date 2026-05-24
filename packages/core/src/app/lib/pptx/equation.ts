import type { PptxEquationNode } from './scene';

const OMML_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

export function createOmmlEquation(node: PptxEquationNode): string | null {
  const source = node.latex ?? node.mathml ?? node.fallbackText;
  if (!source) {
    return null;
  }

  const normalized = normalizeEquationSource(source);
  if (!normalized) {
    return null;
  }

  return `<m:oMathPara><m:oMath>${toOmmlRuns(normalized)}</m:oMath></m:oMathPara>`;
}

export function ensureMathNamespace(xml: string): string {
  if (xml.includes('xmlns:m=')) {
    return xml;
  }
  return xml.replace('<p:sld ', `<p:sld xmlns:m="${OMML_NS}" `);
}

function normalizeEquationSource(source: string): string {
  return source
    .replace(/\\int/g, '\u222B')
    .replace(/\\sum/g, '\u2211')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\s+/g, ' ')
    .trim();
}

function toOmmlRuns(source: string): string {
  const parts: string[] = [];
  let index = 0;

  while (index < source.length) {
    const superscript = readSimpleSuperscript(source, index);
    if (superscript) {
      parts.push(
        `<m:sSup><m:e>${ommlTextRun(superscript.base)}</m:e><m:sup>${ommlTextRun(
          superscript.sup,
        )}</m:sup></m:sSup>`,
      );
      index = superscript.nextIndex;
      continue;
    }

    parts.push(ommlTextRun(source[index] ?? ''));
    index += 1;
  }

  return parts.join('');
}

function readSimpleSuperscript(
  source: string,
  index: number,
): { base: string; nextIndex: number; sup: string } | null {
  const base = source[index];
  if (!base || source[index + 1] !== '^') {
    return null;
  }

  if (source[index + 2] === '{') {
    const end = source.indexOf('}', index + 3);
    if (end === -1) {
      return null;
    }
    return { base, nextIndex: end + 1, sup: source.slice(index + 3, end) };
  }

  const sup = source[index + 2];
  return sup ? { base, nextIndex: index + 3, sup } : null;
}

function ommlTextRun(text: string): string {
  return `<m:r><m:t>${escapeXml(text)}</m:t></m:r>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
