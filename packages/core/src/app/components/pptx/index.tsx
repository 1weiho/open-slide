import type { HTMLAttributes, ImgHTMLAttributes } from 'react';

export type PptxPrimitiveKind =
  | 'text'
  | 'box'
  | 'image'
  | 'shape'
  | 'group'
  | 'raster'
  | 'equation'
  | 'table'
  | 'chart';

export type PptxShapeKind = 'rect' | 'roundRect' | 'ellipse' | 'line';
export type PptxChartType = 'bar' | 'line' | 'pie' | 'doughnut';

export type PptxTextProps = HTMLAttributes<HTMLDivElement>;

export type PptxBoxProps = HTMLAttributes<HTMLDivElement>;

export type PptxImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
};

export type PptxRasterLayerProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  alt: string;
  dataUrl: string;
  reason: string;
};

export type PptxEquationProps = HTMLAttributes<HTMLDivElement> & {
  fallbackText?: string;
  inline?: boolean;
  latex?: string;
  mathml?: string;
};

export type PptxTableProps = HTMLAttributes<HTMLTableElement> & {
  columns: string[];
  rows: string[][];
};

export type PptxChartSeries = {
  color?: string;
  name: string;
  values: number[];
};

export type PptxChartProps = HTMLAttributes<HTMLDivElement> & {
  chartType?: PptxChartType;
  labels: string[];
  series: PptxChartSeries[];
  title?: string;
};

export type PptxShapeProps = HTMLAttributes<HTMLDivElement> & {
  shape?: PptxShapeKind;
};

export type PptxGroupProps = HTMLAttributes<HTMLDivElement>;

export function PptxText({ children, ...props }: PptxTextProps) {
  return (
    <div {...props} data-osd-pptx-kind="text">
      {children}
    </div>
  );
}

export function PptxBox({ children, ...props }: PptxBoxProps) {
  return (
    <div {...props} data-osd-pptx-kind="box">
      {children}
    </div>
  );
}

export function PptxImage({ alt, ...props }: PptxImageProps) {
  return <img {...props} alt={alt} data-osd-pptx-kind="image" />;
}

export function PptxRasterLayer({ alt, dataUrl, reason, ...props }: PptxRasterLayerProps) {
  return (
    <img
      {...props}
      alt={alt}
      src={dataUrl}
      data-osd-pptx-kind="raster"
      data-osd-pptx-reason={reason}
    />
  );
}

export function PptxEquation({
  fallbackText,
  inline = false,
  latex,
  mathml,
  children,
  ...props
}: PptxEquationProps) {
  const text = fallbackText ?? latex ?? mathml ?? children;
  const preview = latex ? renderLatexPreview(latex) : null;
  return (
    <div
      {...props}
      role="img"
      aria-label={typeof text === 'string' ? text : props['aria-label']}
      data-osd-pptx-kind="equation"
      data-osd-pptx-latex={latex}
      data-osd-pptx-mathml={mathml}
      data-osd-pptx-inline={inline ? 'true' : undefined}
      data-osd-pptx-fallback={fallbackText}
    >
      {preview ?? text}
    </div>
  );
}

function renderLatexPreview(source: string) {
  const tokens = tokenizeLatex(source);
  if (tokens.length === 0) {
    return null;
  }

  return tokens.map((token, index) => {
    if (token.kind === 'text') {
      return token.value;
    }

    const key = `${token.kind}-${index}`;
    if (token.kind === 'subsup') {
      return (
        <span key={key} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span>{token.base}</span>
          <span
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              fontSize: '0.46em',
              lineHeight: 0.85,
              marginLeft: '0.04em',
              marginRight: '0.08em',
            }}
          >
            <span>{token.sup}</span>
            <span>{token.sub}</span>
          </span>
        </span>
      );
    }

    if (token.kind === 'sup') {
      return (
        <span key={key}>
          {token.base}
          <sup style={{ fontSize: '0.58em', lineHeight: 0 }}>{token.sup}</sup>
        </span>
      );
    }

    if (token.kind === 'frac') {
      return (
        <span
          key={key}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            fontSize: '0.82em',
            lineHeight: 1,
            marginInline: '0.12em',
            textAlign: 'center',
            verticalAlign: '-0.24em',
          }}
        >
          <span style={{ borderBottom: '0.05em solid currentColor', paddingInline: '0.12em' }}>
            {token.numerator}
          </span>
          <span>{token.denominator}</span>
        </span>
      );
    }

    return null;
  });
}

type LatexToken =
  | { kind: 'text'; value: string }
  | { base: string; kind: 'sup'; sup: string }
  | { base: string; kind: 'subsup'; sub: string; sup: string }
  | { denominator: string; kind: 'frac'; numerator: string };

function tokenizeLatex(source: string): LatexToken[] {
  const tokens: LatexToken[] = [];
  const normalizedSource = source.replace(/\\\\/g, '\\');
  let index = 0;

  while (index < normalizedSource.length) {
    const command = readLatexCommand(normalizedSource, index);
    if (command) {
      if (command.name === 'frac') {
        const numerator = readLatexGroup(normalizedSource, command.nextIndex);
        const denominator = numerator
          ? readLatexGroup(normalizedSource, numerator.nextIndex)
          : null;
        if (numerator && denominator) {
          tokens.push({
            denominator: latexText(denominator.value),
            kind: 'frac',
            numerator: latexText(numerator.value),
          });
          index = denominator.nextIndex;
          continue;
        }
      }

      const base = latexCommandText(command.name);
      const sub =
        normalizedSource[command.nextIndex] === '_'
          ? readLatexScript(normalizedSource, command.nextIndex + 1)
          : null;
      const supStart = sub ? sub.nextIndex : command.nextIndex;
      const sup =
        normalizedSource[supStart] === '^' ? readLatexScript(normalizedSource, supStart + 1) : null;
      if (sub && sup) {
        tokens.push({
          base,
          kind: 'subsup',
          sub: latexText(sub.value),
          sup: latexText(sup.value),
        });
        index = sup.nextIndex;
        continue;
      }
      if (sup) {
        tokens.push({ base, kind: 'sup', sup: latexText(sup.value) });
        index = sup.nextIndex;
        continue;
      }

      tokens.push({ kind: 'text', value: base });
      index = command.nextIndex;
      continue;
    }

    const base = normalizedSource[index] ?? '';
    const sub =
      normalizedSource[index + 1] === '_' ? readLatexScript(normalizedSource, index + 2) : null;
    const supStart = sub ? sub.nextIndex : index + 1;
    const sup =
      normalizedSource[supStart] === '^' ? readLatexScript(normalizedSource, supStart + 1) : null;
    if (sub && sup) {
      tokens.push({
        base: latexText(base),
        kind: 'subsup',
        sub: latexText(sub.value),
        sup: latexText(sup.value),
      });
      index = sup.nextIndex;
      continue;
    }

    const directSup =
      normalizedSource[index + 1] === '^' ? readLatexScript(normalizedSource, index + 2) : null;
    if (directSup) {
      tokens.push({ base: latexText(base), kind: 'sup', sup: latexText(directSup.value) });
      index = directSup.nextIndex;
      continue;
    }

    tokens.push({ kind: 'text', value: latexText(base) });
    index += 1;
  }

  return mergeTextTokens(tokens);
}

function readLatexCommand(
  source: string,
  index: number,
): { name: string; nextIndex: number } | null {
  if (source[index] !== '\\') {
    return null;
  }

  const match = source.slice(index + 1).match(/^[a-zA-Z]+/);
  if (!match) {
    return null;
  }

  return { name: match[0], nextIndex: index + 1 + match[0].length };
}

function readLatexGroup(
  source: string,
  index: number,
): { nextIndex: number; value: string } | null {
  if (source[index] !== '{') {
    return null;
  }

  const end = source.indexOf('}', index + 1);
  if (end === -1) {
    return null;
  }

  return { nextIndex: end + 1, value: source.slice(index + 1, end) };
}

function readLatexScript(
  source: string,
  index: number,
): { nextIndex: number; value: string } | null {
  const group = readLatexGroup(source, index);
  if (group) {
    return group;
  }

  const value = source[index];
  return value ? { nextIndex: index + 1, value } : null;
}

function latexCommandText(command: string): string {
  switch (command) {
    case 'alpha':
      return 'α';
    case 'beta':
      return 'β';
    case 'int':
      return '∫';
    case 'sum':
      return '∑';
    default:
      return command;
  }
}

function latexText(value: string): string {
  return value.replace(/\\([a-zA-Z]+)/g, (_match, command: string) => latexCommandText(command));
}

function mergeTextTokens(tokens: LatexToken[]): LatexToken[] {
  const merged: LatexToken[] = [];
  for (const token of tokens) {
    const previous = merged.at(-1);
    if (token.kind === 'text' && previous?.kind === 'text') {
      previous.value += token.value;
      continue;
    }
    merged.push(token);
  }
  return merged;
}

export function PptxTable({ columns, rows, ...props }: PptxTableProps) {
  return (
    <table
      {...props}
      data-osd-pptx-kind="table"
      data-osd-pptx-table={JSON.stringify({ columns, rows })}
    >
      <thead>
        <tr>
          {columns.map((column, columnIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: PPTX tables render static export metadata.
            <th key={`${column}-${columnIndex}`}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: PPTX tables render static export metadata.
          <tr key={`${row.join('|')}-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: PPTX tables render static export metadata.
              <td key={`${row.join('|')}-${cell}-${cellIndex}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PptxChart({
  chartType = 'bar',
  labels,
  series,
  title,
  children,
  ...props
}: PptxChartProps) {
  return (
    <div
      {...props}
      data-osd-pptx-kind="chart"
      data-osd-pptx-chart={JSON.stringify({ chartType, labels, series, title })}
    >
      {children}
    </div>
  );
}

export function PptxShape({ children, shape = 'rect', ...props }: PptxShapeProps) {
  return (
    <div {...props} data-osd-pptx-kind="shape" data-osd-pptx-shape={shape}>
      {children}
    </div>
  );
}

export function PptxGroup({ children, ...props }: PptxGroupProps) {
  return (
    <div {...props} data-osd-pptx-kind="group">
      {children}
    </div>
  );
}
