import { mml2omml } from 'mathml2omml';
import Temml from 'temml';
import type { PptxEquationNode } from './scene';

const OMML_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const WORD_PROCESSING_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DRAWING_2010_NS = 'http://schemas.microsoft.com/office/drawing/2010/main';

export function createOmmlEquation(node: PptxEquationNode): string | null {
  const source = node.latex ?? node.mathml;
  if (!source) {
    return null;
  }

  try {
    const mathml = node.mathml ?? latexToMathml(source, !node.inline);
    const omml = applyOmmlTextStyle(
      repairGeneratedOmml(normalizeGeneratedOmml(mml2omml(mathml)), mathml),
      node,
    );
    return omml ? `<m:oMathPara>${omml}</m:oMathPara>` : null;
  } catch {
    return null;
  }
}

export function ensureMathNamespace(xml: string): string {
  let output = xml;
  if (!output.includes('xmlns:m=')) {
    output = output.replace('<p:sld ', `<p:sld xmlns:m="${OMML_NS}" `);
  }
  if (!output.includes('xmlns:w=')) {
    output = output.replace('<p:sld ', `<p:sld xmlns:w="${WORD_PROCESSING_NS}" `);
  }
  if (!output.includes('xmlns:a14=')) {
    output = output.replace('<p:sld ', `<p:sld xmlns:a14="${DRAWING_2010_NS}" `);
  }
  return output;
}

function latexToMathml(source: string, displayMode: boolean): string {
  return Temml.renderToString(normalizeLatexSource(source), {
    displayMode,
    throwOnError: true,
    trust: true,
  });
}

function normalizeLatexSource(source: string): string {
  if (!/\\\\[A-Za-z]/.test(source)) {
    return source;
  }

  return source.replace(/\\\\\\\\/g, '\\\\').replace(/\\\\([A-Za-z,;!])/g, '\\$1');
}

function normalizeGeneratedOmml(omml: string): string {
  return omml
    .replace(/\s+xmlns:m="[^"]*"/g, '')
    .replace(/\s+xmlns:w="[^"]*"/g, '')
    .trim();
}

function repairGeneratedOmml(omml: string, mathml: string): string {
  let output = repairNaryOperands(omml);
  output = repairMatrixColumnSpacing(output);
  output = repairBracketedMatrices(output);
  if (mathml.includes('linethickness="0px"')) {
    output = repairNoBarFractions(output);
  }
  return output;
}

function repairNaryOperands(omml: string): string {
  const wrapperMatch = omml.match(/^<m:oMath>([\s\S]*)<\/m:oMath>$/);
  if (!wrapperMatch) {
    return omml;
  }

  const children = splitTopLevelOmmlChildren(wrapperMatch[1]);
  const repaired: string[] = [];

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!isEmptyNary(child)) {
      repaired.push(child);
      continue;
    }

    const operand: string[] = [];
    let cursor = index + 1;
    while (cursor < children.length) {
      const relationSplit = splitRelationChild(children[cursor]);
      if (relationSplit?.before) {
        operand.push(relationSplit.before);
        children[cursor] = relationSplit.after;
        break;
      }
      if (relationSplit) {
        break;
      }

      operand.push(children[cursor]);
      cursor += 1;
    }

    if (operand.length === 0) {
      repaired.push(child);
      continue;
    }

    repaired.push(child.replace('<m:e/>', `<m:e>${operand.join('')}</m:e>`));
    index = cursor - 1;
  }

  return `<m:oMath>${repaired.join('')}</m:oMath>`;
}

function isEmptyNary(child: string): boolean {
  return child.startsWith('<m:nary>') && child.includes('<m:e/>');
}

function splitRelationChild(child: string): { after: string; before?: string } | null {
  const match = child.match(/^<m:r><m:t xml:space="preserve">([^<]*[=<>][^<]*)<\/m:t><\/m:r>$/);
  if (!match) {
    return null;
  }

  const text = match[1];
  const relationIndex = text.search(/[=<>]/);
  if (relationIndex <= 0) {
    return { after: child };
  }

  return {
    after: textRun(text.slice(relationIndex)),
    before: textRun(text.slice(0, relationIndex)),
  };
}

function textRun(text: string): string {
  return `<m:r><m:t xml:space="preserve">${text}</m:t></m:r>`;
}

function applyOmmlTextStyle(omml: string, node: PptxEquationNode): string {
  const runProperties = createWordRunProperties(node);
  if (!runProperties) {
    return omml;
  }

  return omml
    .replace(/<m:r>(?:<w:rPr(?:\/>|>[\s\S]*?<\/w:rPr>))?/g, `<m:r>${runProperties}`)
    .replace(
      /<(m:(?:d|f|nary|sSub|sSup|m)Pr)>((?:(?!<\/\1>)[\s\S])*?)<\/\1>/g,
      (match, tagName: string, content: string) => {
        if (content.includes('<m:ctrlPr>')) {
          return match;
        }
        return `<${tagName}>${content}<m:ctrlPr>${runProperties}</m:ctrlPr></${tagName}>`;
      },
    );
}

function createWordRunProperties(node: PptxEquationNode): string | null {
  const properties: string[] = [];
  if (node.style.color) {
    properties.push(`<w:color w:val="${node.style.color}"/>`);
  }
  if (node.style.fontFace) {
    const fontFace = escapeXml(node.style.fontFace);
    properties.push(`<w:rFonts w:ascii="${fontFace}" w:hAnsi="${fontFace}" w:cs="${fontFace}"/>`);
  }

  return properties.length > 0 ? `<w:rPr>${properties.join('')}</w:rPr>` : null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function repairMatrixColumnSpacing(omml: string): string {
  return omml.replace(/<m:mPr>((?:(?!<\/m:mPr>)[\s\S])*?)<m:mcs>/g, (match, properties) => {
    if (properties.includes('<m:cGpRule') || properties.includes('<m:cGp ')) {
      return match;
    }

    return `<m:mPr>${properties}<m:cGpRule m:val="4"/><m:cGp m:val="4"/><m:mcs>`;
  });
}

function repairBracketedMatrices(omml: string): string {
  return omml.replace(
    /<m:r><m:t xml:space="preserve">\[<\/m:t><\/m:r>(<m:m>[\s\S]*?<\/m:m>)<m:r><m:t xml:space="preserve">\]<\/m:t><\/m:r>/g,
    (_match, matrix: string) =>
      `<m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/></m:dPr><m:e>${matrix}</m:e></m:d>`,
  );
}

function repairNoBarFractions(omml: string): string {
  return omml.replace(
    /(<m:r><m:t xml:space="preserve">\(<\/m:t><\/m:r><m:f><m:fPr>)<m:type m:val="bar"\/>/g,
    '$1<m:type m:val="noBar"/>',
  );
}

function splitTopLevelOmmlChildren(content: string): string[] {
  const children: string[] = [];
  let depth = 0;
  let start = -1;
  let index = 0;

  while (index < content.length) {
    const tag = content.slice(index).match(/^<\/?m:[^>]+>/)?.[0];
    if (!tag) {
      index += 1;
      continue;
    }

    if (tag.startsWith('</')) {
      depth -= 1;
      index += tag.length;
      if (depth === 0 && start >= 0) {
        children.push(content.slice(start, index));
        start = -1;
      }
      continue;
    }

    if (depth === 0) {
      start = index;
    }

    if (!tag.endsWith('/>')) {
      depth += 1;
    }
    index += tag.length;

    if (depth === 0 && start >= 0) {
      children.push(content.slice(start, index));
      start = -1;
    }
  }

  return children;
}
