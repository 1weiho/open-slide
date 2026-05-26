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
  return latexToReadableMath(source).replace(/\s+/g, ' ').trim();
}

function latexToReadableMath(source: string): string {
  let output = source
    .replace(/\\\\/g, '\\')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\alpha/g, '\u03B1')
    .replace(/\\beta/g, '\u03B2')
    .replace(/\\int/g, '\u222B')
    .replace(/\\sum/g, '\u2211');

  output = output.replace(
    /([∫∑A-Za-z0-9)])_\{?([^{}\s^]+)\}?\^\{?([^{}\s]+)\}?/g,
    (_match, base: string, sub: string, sup: string) =>
      `${base}${toSubscript(sub)}${toSuperscript(sup)}`,
  );
  output = output.replace(
    /([∫∑A-Za-z0-9)])\^\{?([^{}\s]+)\}?/g,
    (_match, base: string, sup: string) => `${base}${toSuperscript(sup)}`,
  );
  output = output.replace(
    /([∫∑A-Za-z0-9)])_\{?([^{}\s]+)\}?/g,
    (_match, base: string, sub: string) => `${base}${toSubscript(sub)}`,
  );

  return output;
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '\u2070',
  '1': '\u00B9',
  '2': '\u00B2',
  '3': '\u00B3',
  '4': '\u2074',
  '5': '\u2075',
  '6': '\u2076',
  '7': '\u2077',
  '8': '\u2078',
  '9': '\u2079',
  '+': '\u207A',
  '-': '\u207B',
};

const SUBSCRIPT: Record<string, string> = {
  '0': '\u2080',
  '1': '\u2081',
  '2': '\u2082',
  '3': '\u2083',
  '4': '\u2084',
  '5': '\u2085',
  '6': '\u2086',
  '7': '\u2087',
  '8': '\u2088',
  '9': '\u2089',
  '+': '\u208A',
  '-': '\u208B',
};

function toSuperscript(value: string): string {
  return value
    .split('')
    .map((char) => SUPERSCRIPT[char] ?? char)
    .join('');
}

function toSubscript(value: string): string {
  return value
    .split('')
    .map((char) => SUBSCRIPT[char] ?? char)
    .join('');
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
