import { planGroups } from './groups';
import type {
  PptxColor,
  PptxDeck,
  PptxDiagnostic,
  PptxImage,
  PptxPage,
  PptxPathCommand,
  PptxShadow,
  PptxShape,
  PptxStroke,
  PptxTable,
  PptxText,
} from './model';

const SUPPORTED_IMAGE_MIMES = new Set(['image/gif', 'image/jpeg', 'image/jpg', 'image/png']);
const SUPPORTED_SHAPES = new Set(['rect', 'roundRect', 'ellipse', 'line', 'path']);
const ALIGNS = new Set(['left', 'center', 'right', 'justify']);
const VALIGNS = new Set(['top', 'middle', 'bottom']);
const ARROW_DIRECTIONS = new Set([
  'left',
  'right',
  'up',
  'down',
  'both-horizontal',
  'both-vertical',
]);
const HEX_COLOR = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const DATA_URI = /^data:([^;,]+);base64,([a-z0-9+/\s=]*)$/i;
const BASE64_PAYLOAD = /^[a-z0-9+/]*={0,2}$/i;
const EPSILON = 0.000001;

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null;
}

function diagnostic(
  severity: PptxDiagnostic['severity'],
  code: string,
  page: number,
  source: string,
  message: string,
  suggestion: string,
): PptxDiagnostic {
  return { severity, code, page, source, message, suggestion };
}

function error(
  code: string,
  page: number,
  source: string,
  message: string,
  suggestion: string,
): PptxDiagnostic {
  return diagnostic('error', code, page, source, message, suggestion);
}

function warning(
  code: string,
  page: number,
  source: string,
  message: string,
  suggestion: string,
): PptxDiagnostic {
  return diagnostic('warning', code, page, source, message, suggestion);
}

function stringValue(value: unknown): value is string {
  return typeof value === 'string';
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function integer(value: unknown): value is number {
  return finite(value) && Number.isInteger(value);
}

function finiteNonNegative(value: unknown): value is number {
  return finite(value) && value >= 0;
}

function validColor(value: unknown): value is PptxColor {
  return (
    isRecord(value) &&
    stringValue(value.color) &&
    HEX_COLOR.test(value.color) &&
    finite(value.opacity) &&
    value.opacity >= 0 &&
    value.opacity <= 1
  );
}

function validStroke(value: unknown): value is PptxStroke {
  if (!validColor(value) || !isRecord(value)) return false;
  const stroke = value as PptxStroke;
  return (
    finiteNonNegative(stroke.width) &&
    (stroke.dash === undefined ||
      stroke.dash === 'solid' ||
      stroke.dash === 'dash' ||
      stroke.dash === 'dot') &&
    (stroke.cap === undefined ||
      stroke.cap === 'flat' ||
      stroke.cap === 'round' ||
      stroke.cap === 'square') &&
    (stroke.join === undefined ||
      stroke.join === 'round' ||
      stroke.join === 'miter' ||
      stroke.join === 'bevel')
  );
}

function validXmlAttribute(value: string): boolean {
  return (
    !/[&<>"']/.test(value) &&
    [...value].every((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
  );
}

function invalidXml10CodePoint(value: string): number | undefined {
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code === undefined) continue;
    if (
      code === 0x9 ||
      code === 0xa ||
      code === 0xd ||
      (code >= 0x20 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd) ||
      (code >= 0x10000 && code <= 0x10ffff)
    )
      continue;
    return code;
  }
  return undefined;
}

function validateXml10Text(
  value: string,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): void {
  const code = invalidXml10CodePoint(value);
  if (code === undefined) return;
  const codePoint = `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  diagnostics.push(
    error(
      'invalid-xml-character',
      page,
      source,
      `The value contains the XML 1.0-invalid character ${codePoint}.`,
      'Remove only XML 1.0-invalid control characters while preserving legal whitespace and Unicode text.',
    ),
  );
}

function validateShadow(
  value: unknown,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(value)) {
    diagnostics.push(
      error(
        'invalid-shadow',
        page,
        source,
        'An object shadow must contain a color, offset and blur radius.',
        'Use a valid color with finite CSS pixel offsets and blur.',
      ),
    );
    return;
  }
  const shadow = value as PptxShadow;
  if (!validColor(shadow))
    diagnostics.push(
      error(
        'invalid-shadow-color',
        page,
        source,
        'An object shadow has an invalid color or opacity.',
        'Use a three or six digit hex color and opacity from 0 to 1.',
      ),
    );
  if (!finite(shadow.x) || !finite(shadow.y))
    diagnostics.push(
      error(
        'invalid-shadow-offset',
        page,
        source,
        'Shadow offsets must be finite pixel values.',
        'Use finite CSS pixel x and y offsets.',
      ),
    );
  if (!finiteNonNegative(shadow.blur))
    diagnostics.push(
      error(
        'invalid-shadow-blur',
        page,
        source,
        'A shadow blur radius must be finite and nonnegative.',
        'Use a nonnegative CSS blur radius in pixels.',
      ),
    );
  if (shadow.inset !== undefined && typeof shadow.inset !== 'boolean')
    diagnostics.push(
      error(
        'invalid-shadow-inset',
        page,
        source,
        'A shadow inset flag must be boolean when provided.',
        'Use true for an inner shadow or false for an outer shadow.',
      ),
    );
}

function validateGradient(
  value: unknown,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(value)) {
    diagnostics.push(
      error(
        'invalid-gradient',
        page,
        source,
        'A shape gradient is not an object.',
        'Provide a linear or radial gradient with at least two stops.',
      ),
    );
    return;
  }
  const kind = value.kind;
  if (kind !== 'linear' && kind !== 'radial')
    diagnostics.push(
      error(
        'unsupported-gradient',
        page,
        source,
        `The ${String(kind)} gradient kind is unsupported.`,
        'Use a linear or radial gradient.',
      ),
    );
  if (!Array.isArray(value.stops) || value.stops.length < 2) {
    diagnostics.push(
      error(
        'invalid-gradient-stops',
        page,
        source,
        'A gradient must contain at least two color stops.',
        'Provide two or more ordered stops between offsets 0 and 1.',
      ),
    );
  } else {
    let previous = -Infinity;
    value.stops.forEach((stop, index) => {
      if (!isRecord(stop)) {
        diagnostics.push(
          error(
            'invalid-gradient-stop',
            page,
            `${source}/stop[${index}]`,
            'A gradient stop is not an object.',
            'Provide a finite offset and a valid color.',
          ),
        );
        return;
      }
      if (!finite(stop.offset) || stop.offset < 0 || stop.offset > 1)
        diagnostics.push(
          error(
            'invalid-gradient-offset',
            page,
            `${source}/stop[${index}]`,
            'A gradient stop offset must be finite and between 0 and 1.',
            'Use normalized ordered offsets from 0 through 1.',
          ),
        );
      else if (stop.offset < previous)
        diagnostics.push(
          error(
            'unordered-gradient-stops',
            page,
            `${source}/stop[${index}]`,
            'Gradient stops must be ordered by offset.',
            'Sort stops in nondecreasing offset order; equal offsets are valid hard edges.',
          ),
        );
      else previous = stop.offset;
      if (!validColor(stop.color))
        diagnostics.push(
          error(
            'invalid-gradient-color',
            page,
            `${source}/stop[${index}]`,
            'A gradient stop has an invalid color or opacity.',
            'Use a three or six digit hex color and opacity from 0 to 1.',
          ),
        );
    });
  }
  if (value.angle !== undefined && !finite(value.angle))
    diagnostics.push(
      error(
        'invalid-gradient-angle',
        page,
        source,
        'A gradient angle must be finite when provided.',
        'Use a finite CSS angle in degrees.',
      ),
    );
  if (kind === 'radial' && value.angle !== undefined)
    diagnostics.push(
      error(
        'unsupported-gradient-angle',
        page,
        source,
        'Radial gradients do not accept a linear angle.',
        'Use center and radius for a radial gradient.',
      ),
    );
  if (kind === 'linear' && (value.center !== undefined || value.radius !== undefined))
    diagnostics.push(
      error(
        'unsupported-gradient-focus',
        page,
        source,
        'Linear gradients do not accept radial center or radius values.',
        'Use angle for a linear gradient.',
      ),
    );
  if (value.center !== undefined) {
    if (
      !isRecord(value.center) ||
      !finite(value.center.x) ||
      !finite(value.center.y) ||
      value.center.x < 0 ||
      value.center.x > 1 ||
      value.center.y < 0 ||
      value.center.y > 1
    )
      diagnostics.push(
        error(
          'invalid-gradient-center',
          page,
          source,
          'A radial gradient center must be finite normalized coordinates.',
          'Use center x and y values from 0 through 1.',
        ),
      );
  }
  if (value.radius !== undefined) {
    if (
      !isRecord(value.radius) ||
      !finite(value.radius.x) ||
      value.radius.x <= 0 ||
      !finite(value.radius.y) ||
      value.radius.y <= 0
    )
      diagnostics.push(
        error(
          'invalid-gradient-radius',
          page,
          source,
          'A radial gradient radius must be finite and positive.',
          'Use positive normalized x and y radii.',
        ),
      );
  }
}

function validateGradientBounds(
  value: unknown,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(value) || !finite(value.w) || value.w <= 0 || !finite(value.h) || value.h <= 0)
    diagnostics.push(
      error(
        'invalid-gradient-bounds',
        page,
        source,
        'Text gradient bounds must be positive finite dimensions.',
        'Provide the positive pixel bounds used to resolve the text gradient.',
      ),
    );
}

function pathPointInBounds(
  x: unknown,
  y: unknown,
  object: PptxShape,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): boolean {
  if (!finite(x) || !finite(y)) {
    diagnostics.push(
      error(
        'invalid-path-coordinate',
        page,
        source,
        'A custom path coordinate must be finite.',
        'Use finite local pixel coordinates within the object bounds.',
      ),
    );
    return false;
  }
  if (x < -EPSILON || y < -EPSILON || x > object.w + EPSILON || y > object.h + EPSILON) {
    diagnostics.push(
      error(
        'path-out-of-bounds',
        page,
        source,
        'A custom path coordinate lies outside its local object bounds.',
        'Keep path coordinates between 0 and the object width or height.',
      ),
    );
    return false;
  }
  return true;
}

function validatePath(
  value: unknown,
  object: PptxShape,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    diagnostics.push(
      error(
        'invalid-path',
        page,
        source,
        'A custom path must contain at least one command.',
        'Provide a move command followed by line, cubic or close commands.',
      ),
    );
    return;
  }
  let hasPoint = false;
  let hasMove = false;
  value.forEach((command, index) => {
    const commandSource = `${source}/path[${index}]`;
    if (!isRecord(command) || typeof command.type !== 'string') {
      diagnostics.push(
        error(
          'invalid-path-command',
          page,
          commandSource,
          'A custom path command is malformed.',
          'Use move, line, cubic or close commands.',
        ),
      );
      return;
    }
    switch (command.type as PptxPathCommand['type']) {
      case 'move':
      case 'line':
        pathPointInBounds(command.x, command.y, object, page, commandSource, diagnostics);
        hasPoint = true;
        if (command.type === 'move') hasMove = true;
        break;
      case 'cubic':
        pathPointInBounds(command.x, command.y, object, page, commandSource, diagnostics);
        pathPointInBounds(command.x1, command.y1, object, page, commandSource, diagnostics);
        pathPointInBounds(command.x2, command.y2, object, page, commandSource, diagnostics);
        hasPoint = true;
        break;
      case 'close':
        if (!hasPoint)
          diagnostics.push(
            error(
              'invalid-path-close',
              page,
              commandSource,
              'A custom path cannot close before it has a point.',
              'Start the path with a move or line command.',
            ),
          );
        break;
      default:
        diagnostics.push(
          error(
            'unsupported-path-command',
            page,
            commandSource,
            `The ${command.type} custom path command is unsupported.`,
            'Use move, line, cubic or close commands.',
          ),
        );
    }
  });
  if (!hasMove)
    diagnostics.push(
      error(
        'invalid-path-start',
        page,
        source,
        'A custom path must start with a move command.',
        'Start the path with a move command in local pixel coordinates.',
      ),
    );
}

function validateLink(
  link: unknown,
  page: number,
  source: string,
  pageCount: number,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(link)) {
    diagnostics.push(
      error(
        'invalid-link',
        page,
        source,
        'A hyperlink must contain a URL or slide number.',
        'Use an https, http or mailto URL, or a valid slide number.',
      ),
    );
    return;
  }
  if ('url' in link) {
    if (!stringValue(link.url) || !link.url.trim()) {
      diagnostics.push(
        error(
          'invalid-link',
          page,
          source,
          'A hyperlink URL is empty.',
          'Use an https, http or mailto URL.',
        ),
      );
      return;
    }
    const linkSource = `${source}/url`;
    const beforeUrlValidation = diagnostics.length;
    validateXml10Text(link.url, page, linkSource, diagnostics);
    if (diagnostics.length !== beforeUrlValidation) return;
    let parsed: URL;
    try {
      parsed = new URL(link.url);
    } catch {
      diagnostics.push(
        error(
          'invalid-link',
          page,
          source,
          'The hyperlink URL is not valid.',
          'Use an absolute https, http or mailto URL.',
        ),
      );
      return;
    }
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      diagnostics.push(
        error(
          'unsafe-link',
          page,
          source,
          `The ${parsed.protocol} hyperlink scheme is not allowed.`,
          'Use an https, http or mailto URL.',
        ),
      );
    }
    return;
  }
  if ('slide' in link) {
    if (!integer(link.slide) || link.slide < 1 || link.slide > pageCount) {
      diagnostics.push(
        error(
          'invalid-slide-link',
          page,
          source,
          'The slide hyperlink points outside this deck.',
          `Use a slide number from 1 to ${pageCount}.`,
        ),
      );
    }
    return;
  }
  diagnostics.push(
    error(
      'invalid-link',
      page,
      source,
      'A hyperlink must contain a URL or slide number.',
      'Use an https, http or mailto URL, or a valid slide number.',
    ),
  );
}

function validateRect(
  object: RecordLike,
  page: number,
  source: string,
  deckWidth: number,
  deckHeight: number,
  diagnostics: PptxDiagnostic[],
  requireArea: boolean,
): void {
  for (const name of ['x', 'y', 'w', 'h']) {
    if (!finite(object[name])) {
      diagnostics.push(
        error(
          'invalid-dimension',
          page,
          source,
          `${name} must be a finite number.`,
          'Use finite pixel coordinates and dimensions.',
        ),
      );
    }
  }
  if (!finite(object.x) || !finite(object.y) || !finite(object.w) || !finite(object.h)) return;
  if (
    object.x < 0 ||
    object.y < 0 ||
    object.w < 0 ||
    object.h < 0 ||
    (requireArea && (object.w <= 0 || object.h <= 0))
  ) {
    diagnostics.push(
      error(
        'invalid-bounds',
        page,
        source,
        'An object has a negative or zero-size bounding box.',
        'Use nonnegative coordinates and positive width and height.',
      ),
    );
  }
  if (object.x + object.w > deckWidth + EPSILON || object.y + object.h > deckHeight + EPSILON) {
    diagnostics.push(
      error(
        'out-of-bounds',
        page,
        source,
        'An object extends beyond the canonical slide canvas.',
        'Keep the object within the 1920 x 1080 canvas.',
      ),
    );
  }
}

function validateRun(
  run: unknown,
  page: number,
  source: string,
  pageCount: number,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(run)) {
    diagnostics.push(
      error(
        'invalid-run',
        page,
        source,
        'A text run is not an object.',
        'Provide a text run with text and formatting.',
      ),
    );
    return;
  }
  if (!stringValue(run.text))
    diagnostics.push(
      error(
        'invalid-run-text',
        page,
        source,
        'A text run must contain a string.',
        'Preserve the source text as a string.',
      ),
    );
  else validateXml10Text(run.text, page, source, diagnostics);
  if (!stringValue(run.fontFace) || !run.fontFace.trim())
    diagnostics.push(
      error(
        'invalid-font',
        page,
        source,
        'A text run has no font face.',
        'Provide the resolved font family.',
      ),
    );
  else validateXml10Text(run.fontFace, page, `${source}/fontFace`, diagnostics);
  for (const field of ['latinFontFace', 'eastAsianFontFace'] as const) {
    const face = run[field];
    if (face !== undefined) {
      if (!stringValue(face) || !face.trim())
        diagnostics.push(
          error(
            'invalid-font-face',
            page,
            source,
            `The ${field} must be a nonempty font name.`,
            'Preserve a resolved font name.',
          ),
        );
      else validateXml10Text(face, page, `${source}/${field}`, diagnostics);
    }
  }
  if (run.fontResolutions !== undefined) {
    if (!Array.isArray(run.fontResolutions)) {
      diagnostics.push(
        error(
          'invalid-font-evidence',
          page,
          source,
          'Font resolutions must be an array.',
          'Preserve the measured font evidence.',
        ),
      );
    } else
      for (const value of run.fontResolutions) {
        if (
          !isRecord(value) ||
          !Array.isArray(value.requested) ||
          !value.requested.every((face) => stringValue(face) && face.trim()) ||
          !stringValue(value.resolved) ||
          !value.resolved.trim() ||
          !['latin', 'eastAsian', 'other'].includes(String(value.script)) ||
          (value.language !== null && !stringValue(value.language)) ||
          typeof value.substituted !== 'boolean' ||
          !Array.isArray(value.reasons) ||
          !value.reasons.every(stringValue) ||
          !isRecord(value.layout) ||
          !finite(value.layout.advanceDeltaPx) ||
          value.layout.advanceDeltaPx < 0 ||
          !['preserved', 'safe', 'unsafe', 'unknown'].includes(String(value.layout.status))
        ) {
          diagnostics.push(
            error(
              'invalid-font-evidence',
              page,
              source,
              'A font resolution has invalid evidence.',
              'Re-measure the font selection and layout.',
            ),
          );
          continue;
        }
        if (
          value.coverage !== 'supported' ||
          (value.substituted && value.layout.status !== 'safe') ||
          (!value.substituted && !['preserved', 'safe'].includes(String(value.layout.status)))
        ) {
          diagnostics.push(
            error(
              'unsafe-font-evidence',
              page,
              source,
              'Font coverage or replacement layout has not passed its checks.',
              'Use a font with proven glyph coverage and safe measured bounds.',
            ),
          );
        }
        const face =
          value.script === 'eastAsian'
            ? run.eastAsianFontFace
            : (run.latinFontFace ?? run.fontFace);
        if (face !== value.resolved || (value.language ?? 'und') !== run.lang)
          diagnostics.push(
            error(
              'font-evidence-mismatch',
              page,
              source,
              'The run font or language differs from its resolution evidence.',
              'Keep the resolved font and language with their run.',
            ),
          );
        validateXml10Text(value.resolved, page, `${source}/resolvedFont`, diagnostics);
      }
  }
  if (!finite(run.fontSize) || run.fontSize <= 0)
    diagnostics.push(
      error(
        'invalid-font-size',
        page,
        source,
        'A text run font size must be positive and finite.',
        'Use the resolved CSS font size in pixels.',
      ),
    );
  if (!validColor(run.color))
    diagnostics.push(
      error(
        'invalid-color',
        page,
        source,
        'A text run has an invalid color or opacity.',
        'Use a three or six digit hex color and opacity from 0 to 1.',
      ),
    );
  if (!finite(run.letterSpacing))
    diagnostics.push(
      error(
        'invalid-letter-spacing',
        page,
        source,
        'A text run letter spacing must be finite.',
        'Use the resolved CSS letter spacing in pixels.',
      ),
    );
  if (!stringValue(run.lang) || !run.lang.trim())
    diagnostics.push(
      error(
        'invalid-language',
        page,
        source,
        'A text run has no language tag.',
        'Use an ISO language tag such as en-US or zh-TW.',
      ),
    );
  else validateXml10Text(run.lang, page, `${source}/lang`, diagnostics);
  if (run.gradient !== undefined) {
    validateGradient(run.gradient, page, `${source}/gradient`, diagnostics);
    if (isRecord(run.gradient) && run.gradient.kind === 'radial')
      diagnostics.push(
        error(
          'unsupported-radial-text',
          page,
          source,
          'Radial gradient text is not supported by the native text fill adapter.',
          'Use a linear gradient for text or a radial gradient on a decorative shape.',
        ),
      );
    if (run.gradientBounds !== undefined)
      validateGradientBounds(run.gradientBounds, page, `${source}/gradientBounds`, diagnostics);
  } else if (run.gradientBounds !== undefined)
    diagnostics.push(
      error(
        'gradient-bounds-without-gradient',
        page,
        source,
        'Text gradient bounds were provided without a gradient.',
        'Provide gradient data or remove the unused gradient bounds.',
      ),
    );
  if (run.link !== undefined) validateLink(run.link, page, source, pageCount, diagnostics);
}

function validateParagraph(
  paragraph: unknown,
  page: number,
  source: string,
  pageCount: number,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(paragraph)) {
    diagnostics.push(
      error(
        'invalid-paragraph',
        page,
        source,
        'A paragraph is not an object.',
        'Provide a paragraph with one or more runs.',
      ),
    );
    return;
  }
  if (!Array.isArray(paragraph.runs)) {
    diagnostics.push(
      error(
        'invalid-paragraph-runs',
        page,
        source,
        'A paragraph must contain a run array.',
        'Provide the paragraph runs without flattening their formatting.',
      ),
    );
  } else {
    paragraph.runs.forEach((run, index) => {
      validateRun(run, page, `${source}/run[${index}]`, pageCount, diagnostics);
    });
  }
  if (!stringValue(paragraph.align) || !ALIGNS.has(paragraph.align))
    diagnostics.push(
      error(
        'invalid-alignment',
        page,
        source,
        'A paragraph has an unsupported alignment.',
        'Use left, center, right or justify.',
      ),
    );
  for (const name of ['lineHeight', 'spaceBefore', 'spaceAfter']) {
    if (!finiteNonNegative(paragraph[name]))
      diagnostics.push(
        error(
          'invalid-paragraph-spacing',
          page,
          source,
          `${name} must be a finite nonnegative number.`,
          'Use resolved CSS spacing in pixels.',
        ),
      );
  }
  if (paragraph.list !== undefined) {
    if (!isRecord(paragraph.list) || !['bullet', 'number'].includes(String(paragraph.list.kind))) {
      diagnostics.push(
        error(
          'unsupported-list',
          page,
          source,
          'The paragraph list kind is unsupported.',
          'Use a bullet or decimal numbered list.',
        ),
      );
    } else {
      if (!integer(paragraph.list.start) || paragraph.list.start < 1)
        diagnostics.push(
          error(
            'invalid-list-start',
            page,
            source,
            'A numbered list start must be a positive integer.',
            'Use a positive decimal list start.',
          ),
        );
      if (!integer(paragraph.list.level) || paragraph.list.level < 0)
        diagnostics.push(
          error(
            'invalid-list-level',
            page,
            source,
            'A list level must be a nonnegative integer.',
            'Use zero for a top-level list.',
          ),
        );
      if (!finiteNonNegative(paragraph.list.indent) || !finiteNonNegative(paragraph.list.hanging))
        diagnostics.push(
          error(
            'invalid-list-indent',
            page,
            source,
            'List indent and hanging values must be nonnegative and finite.',
            'Use resolved CSS indentation in pixels.',
          ),
        );
    }
  }
}

function validateText(
  object: PptxText,
  page: number,
  source: string,
  pageCount: number,
  diagnostics: PptxDiagnostic[],
): void {
  const wrap = (object as PptxText & { wrap?: unknown }).wrap;
  if (wrap !== undefined && typeof wrap !== 'boolean')
    diagnostics.push(
      error(
        'invalid-text-wrap',
        page,
        source,
        'A text object wrap value must be boolean when provided.',
        'Use true for wrapping text or false for a single line.',
      ),
    );
  if (!Array.isArray(object.paragraphs) || object.paragraphs.length === 0) {
    diagnostics.push(
      error(
        'empty-text',
        page,
        source,
        'A text object has no paragraphs.',
        'Preserve visible text as at least one paragraph.',
      ),
    );
    return;
  }
  let hasText = false;
  object.paragraphs.forEach((paragraph, index) => {
    if (
      isRecord(paragraph) &&
      Array.isArray(paragraph.runs) &&
      paragraph.runs.some(
        (run) => isRecord(run) && typeof run.text === 'string' && run.text.length > 0,
      )
    )
      hasText = true;
    validateParagraph(paragraph, page, `${source}/paragraph[${index}]`, pageCount, diagnostics);
  });
  if (!hasText)
    diagnostics.push(
      error(
        'empty-text',
        page,
        source,
        'A text object contains no text.',
        'Preserve visible text as at least one nonempty run.',
      ),
    );
}

function validateShape(
  object: PptxShape,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): void {
  if (!SUPPORTED_SHAPES.has(object.geometry)) {
    diagnostics.push(
      error(
        'unsupported-shape',
        page,
        source,
        `The ${String(object.geometry)} shape is not supported.`,
        'Use rect, roundRect, ellipse, line or path.',
      ),
    );
  }
  if (object.fill !== undefined && !validColor(object.fill))
    diagnostics.push(
      error(
        'invalid-fill',
        page,
        source,
        'A shape fill has an invalid color or opacity.',
        'Use a hex color and opacity from 0 to 1.',
      ),
    );
  if (object.stroke !== undefined && !validStroke(object.stroke))
    diagnostics.push(
      error(
        'invalid-stroke',
        page,
        source,
        'A shape stroke has invalid color, width or dash data.',
        'Use a finite pixel width and a supported dash style.',
      ),
    );
  if (object.gradient !== undefined) validateGradient(object.gradient, page, source, diagnostics);
  if (object.gradient?.kind === 'radial' && object.shadow !== undefined)
    diagnostics.push(
      error(
        'unsupported-radial-effects',
        page,
        source,
        'Radial gradient shapes cannot be combined with native shape shadows in editable PowerPoint.',
        'Remove the native shadow, or use a linear gradient for this shape.',
      ),
    );
  if (object.geometry === 'line' && object.gradient !== undefined)
    diagnostics.push(
      error(
        'unsupported-gradient-shape',
        page,
        source,
        'Gradient fills are not supported on line shapes.',
        'Use a filled shape geometry for a gradient.',
      ),
    );
  if (object.geometry === 'path') validatePath(object.path, object, page, source, diagnostics);
  else if (object.path !== undefined)
    diagnostics.push(
      error(
        'unsupported-path',
        page,
        source,
        'A custom path is only valid for a path geometry shape.',
        'Set geometry to path when providing path commands.',
      ),
    );
  if (object.geometry === 'line' && object.w === 0 && object.h === 0)
    diagnostics.push(
      error(
        'invalid-line',
        page,
        source,
        'A line has no length.',
        'Give the line a nonzero horizontal or vertical extent.',
      ),
    );
  if (object.geometry !== 'line' && (object.startArrow || object.endArrow))
    diagnostics.push(
      error(
        'unsupported-arrow',
        page,
        source,
        'Arrowheads are only supported on line shapes.',
        'Use a line shape for arrows.',
      ),
    );
  if (object.geometry === 'roundRect' && object.radius !== undefined) {
    if (!finiteNonNegative(object.radius))
      diagnostics.push(
        error(
          'invalid-radius',
          page,
          source,
          'A rounded rectangle radius must be finite and nonnegative.',
          'Use a CSS radius in pixels.',
        ),
      );
    else if (object.radius > 0)
      diagnostics.push(
        warning(
          'roundRect-approximation',
          page,
          source,
          'PowerPoint rounded rectangles approximate the source corner radius.',
          'Use equal corner radii when the exact silhouette matters.',
        ),
      );
  }
}

function validImageData(data: string): { mime?: string; valid: boolean } {
  const match = DATA_URI.exec(data.trim());
  if (match)
    return {
      mime: match[1].toLowerCase(),
      valid: validBase64Payload(match[2]),
    };
  const raw = data.trim();
  return { valid: validBase64Payload(raw) };
}

function validBase64Payload(data: string): boolean {
  const payload = data.replace(/\s/g, '');
  return payload.length > 0 && payload.length % 4 === 0 && BASE64_PAYLOAD.test(payload);
}

function validSvgData(data: string): boolean {
  const comma = data.indexOf(',');
  if (comma < 0) return false;
  const header = data.slice(0, comma).toLowerCase();
  if (!header.startsWith('data:image/svg+xml;') || !header.split(';').includes('base64'))
    return false;
  const payload = data.slice(comma + 1).replace(/\s/g, '');
  return validBase64Payload(payload);
}

function validateImage(
  object: PptxImage,
  page: number,
  source: string,
  diagnostics: PptxDiagnostic[],
): void {
  const mime = stringValue(object.mime) ? object.mime.toLowerCase() : '';
  if (!SUPPORTED_IMAGE_MIMES.has(mime))
    diagnostics.push(
      error(
        'unsupported-image-mime',
        page,
        source,
        `The ${mime || 'empty'} image MIME type is unsupported.`,
        'Embed PNG, JPEG or GIF image data.',
      ),
    );
  if (!stringValue(object.assetId) || !object.assetId.trim())
    diagnostics.push(
      error(
        'missing-asset-id',
        page,
        source,
        'An image has no asset identifier.',
        'Preserve the source asset identifier.',
      ),
    );
  if (!stringValue(object.data) || !object.data.trim()) {
    diagnostics.push(
      error(
        'missing-asset-data',
        page,
        source,
        'An image has no embedded data.',
        'Resolve the image bytes before invoking the writer.',
      ),
    );
  } else {
    const parsed = validImageData(object.data);
    if (!parsed.valid)
      diagnostics.push(
        error(
          'invalid-asset-data',
          page,
          source,
          'Image data is not valid base64 data.',
          'Embed a complete data URL or base64 payload.',
        ),
      );
    if (
      parsed.mime &&
      parsed.mime !== mime &&
      !(parsed.mime === 'image/jpg' && mime === 'image/jpeg')
    )
      diagnostics.push(
        error(
          'asset-mime-mismatch',
          page,
          source,
          'The embedded image MIME type does not match its declared MIME type.',
          'Keep the data URL and MIME field in sync.',
        ),
      );
  }
  if (object.crop !== undefined) {
    const crop = object.crop;
    if (!isRecord(crop)) {
      diagnostics.push(
        error(
          'invalid-image-crop',
          page,
          source,
          'Image crop edges must be finite normalized values.',
          'Use normalized 0 to 1 crop edges.',
        ),
      );
    } else {
      const edges = (['left', 'top', 'right', 'bottom'] as const).map((name) => crop[name]);
      const [left, top, right, bottom] = edges;
      if (edges.some((edge) => !finiteNonNegative(edge))) {
        diagnostics.push(
          error(
            'invalid-image-crop',
            page,
            source,
            'Image crop edges must be finite normalized values.',
            'Use normalized 0 to 1 crop edges.',
          ),
        );
      } else if (
        (left as number) + (right as number) >= 1 ||
        (top as number) + (bottom as number) >= 1 ||
        edges.some((edge) => (edge as number) > 1)
      ) {
        diagnostics.push(
          error(
            'invalid-image-crop',
            page,
            source,
            'Image crop removes the entire source image or exceeds its bounds.',
            'Use normalized edges whose opposing sums are below 1.',
          ),
        );
      }
    }
  }
  if (object.svgData !== undefined) {
    if (!stringValue(object.svgData) || !validSvgData(object.svgData))
      diagnostics.push(
        error(
          'invalid-svg-data',
          page,
          source,
          'The original SVG must be a base64 image/svg+xml data URL.',
          'Provide original SVG bytes as a base64 data URL alongside the PNG fallback.',
        ),
      );
  }
  if (
    object.opacity !== undefined &&
    (!finite(object.opacity) || object.opacity < 0 || object.opacity > 1)
  )
    diagnostics.push(
      error(
        'invalid-image-opacity',
        page,
        source,
        'An image opacity must be finite and between 0 and 1.',
        'Use an image opacity from 0 through 1.',
      ),
    );
}

function validateCell(
  cell: unknown,
  page: number,
  source: string,
  pageCount: number,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(cell)) {
    diagnostics.push(
      error(
        'invalid-table-cell',
        page,
        source,
        'A table cell is not an object.',
        'Provide a cell with paragraphs, padding, borders and alignment.',
      ),
    );
    return;
  }
  if (!Array.isArray(cell.paragraphs) || cell.paragraphs.length === 0)
    diagnostics.push(
      error(
        'empty-table-cell',
        page,
        source,
        'A table cell has no paragraphs.',
        'Preserve each cell as a native text body.',
      ),
    );
  else
    cell.paragraphs.forEach((paragraph, index) => {
      validateParagraph(paragraph, page, `${source}/paragraph[${index}]`, pageCount, diagnostics);
    });
  if (cell.fill !== undefined && !validColor(cell.fill))
    diagnostics.push(
      error(
        'invalid-cell-fill',
        page,
        source,
        'A table cell fill has an invalid color or opacity.',
        'Use a hex color and opacity from 0 to 1.',
      ),
    );
  if (
    !Array.isArray(cell.borders) ||
    cell.borders.length !== 4 ||
    cell.borders.some((stroke) => !validStroke(stroke))
  )
    diagnostics.push(
      error(
        'invalid-cell-borders',
        page,
        source,
        'A table cell must have four valid border definitions.',
        'Provide borders in top, right, bottom, left order.',
      ),
    );
  if (
    !Array.isArray(cell.padding) ||
    cell.padding.length !== 4 ||
    cell.padding.some((value) => !finiteNonNegative(value))
  )
    diagnostics.push(
      error(
        'invalid-cell-padding',
        page,
        source,
        'A table cell must have four finite nonnegative padding values.',
        'Provide padding in top, right, bottom, left pixels.',
      ),
    );
  if (!stringValue(cell.valign) || !VALIGNS.has(cell.valign))
    diagnostics.push(
      error(
        'invalid-cell-alignment',
        page,
        source,
        'A table cell has an unsupported vertical alignment.',
        'Use top, middle or bottom.',
      ),
    );
}

function validateTable(
  object: PptxTable,
  page: number,
  source: string,
  pageCount: number,
  diagnostics: PptxDiagnostic[],
): void {
  if (
    !Array.isArray(object.rows) ||
    object.rows.length === 0 ||
    !Array.isArray(object.rows[0]) ||
    object.rows[0].length === 0
  ) {
    diagnostics.push(
      error(
        'table-nonrectangular',
        page,
        source,
        'A table must contain at least one row and column.',
        'Use a nonempty rectangular table.',
      ),
    );
    return;
  }
  const columns = object.rows[0].length;
  if (object.rows.some((row) => !Array.isArray(row) || row.length !== columns))
    diagnostics.push(
      error(
        'table-nonrectangular',
        page,
        source,
        'Table rows have inconsistent column counts.',
        'Use a rectangular table without merged cells.',
      ),
    );
  object.rows.forEach((row, rowIndex) => {
    if (Array.isArray(row))
      row.forEach((cell, columnIndex) => {
        validateCell(
          cell,
          page,
          `${source}/cell[${rowIndex},${columnIndex}]`,
          pageCount,
          diagnostics,
        );
      });
  });
  if (
    !Array.isArray(object.columnWidths) ||
    object.columnWidths.length !== columns ||
    object.columnWidths.some((value) => !finite(value) || value <= 0)
  )
    diagnostics.push(
      error(
        'invalid-table-columns',
        page,
        source,
        'Table column widths must match the matrix and be positive.',
        'Provide one positive pixel width per column.',
      ),
    );
  if (
    !Array.isArray(object.rowHeights) ||
    object.rowHeights.length !== object.rows.length ||
    object.rowHeights.some((value) => !finite(value) || value <= 0)
  )
    diagnostics.push(
      error(
        'invalid-table-rows',
        page,
        source,
        'Table row heights must match the matrix and be positive.',
        'Provide one positive pixel height per row.',
      ),
    );
  if (
    Array.isArray(object.columnWidths) &&
    object.columnWidths.length === columns &&
    finite(object.w)
  ) {
    const total = object.columnWidths.reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - object.w) > 0.5)
      diagnostics.push(
        error(
          'table-width-mismatch',
          page,
          source,
          'Table column widths do not add up to its bounding-box width.',
          'Keep the table width equal to the sum of its columns.',
        ),
      );
  }
  if (
    Array.isArray(object.rowHeights) &&
    object.rowHeights.length === object.rows.length &&
    finite(object.h)
  ) {
    const total = object.rowHeights.reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - object.h) > 0.5)
      diagnostics.push(
        error(
          'table-height-mismatch',
          page,
          source,
          'Table row heights do not add up to its bounding-box height.',
          'Keep the table height equal to the sum of its rows.',
        ),
      );
  }
}

function validateObject(
  object: unknown,
  page: number,
  source: string,
  deckWidth: number,
  deckHeight: number,
  pageCount: number,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(object)) {
    diagnostics.push(
      error(
        'invalid-object',
        page,
        source,
        'A slide object is not an object.',
        'Provide a supported native text, shape, table or image object.',
      ),
    );
    return;
  }
  const requireArea = object.kind !== 'shape' || object.geometry !== 'line';
  validateRect(object, page, source, deckWidth, deckHeight, diagnostics, requireArea);
  if (!stringValue(object.id) || !object.id.trim())
    diagnostics.push(
      error(
        'missing-object-id',
        page,
        source,
        'A slide object has no stable ID.',
        'Preserve a unique source object ID.',
      ),
    );
  else if (!validXmlAttribute(object.id))
    diagnostics.push(
      error(
        'invalid-object-id',
        page,
        source,
        'A slide object ID contains XML-invalid characters.',
        'Use a stable ID without XML control characters or markup characters.',
      ),
    );
  if (!stringValue(object.source) || !object.source.trim())
    diagnostics.push(
      error(
        'missing-object-source',
        page,
        source,
        'A slide object has no source locator.',
        'Preserve the source element locator.',
      ),
    );
  if (!integer(object.order) || object.order < 0)
    diagnostics.push(
      error(
        'invalid-object-order',
        page,
        source,
        'A slide object order must be a nonnegative integer.',
        'Preserve paint order as a nonnegative integer.',
      ),
    );
  if (object.rotation !== undefined && !finite(object.rotation))
    diagnostics.push(
      error(
        'invalid-rotation',
        page,
        source,
        'An object rotation must be finite when provided.',
        'Use a finite rotation in degrees.',
      ),
    );
  if (object.shadow !== undefined) validateShadow(object.shadow, page, source, diagnostics);
  if (object.blur !== undefined && !finiteNonNegative(object.blur))
    diagnostics.push(
      error(
        'invalid-blur',
        page,
        source,
        'An object blur radius must be finite and nonnegative.',
        'Use a nonnegative CSS blur radius in pixels.',
      ),
    );
  if (object.link !== undefined) validateLink(object.link, page, source, pageCount, diagnostics);
  switch (object.kind) {
    case 'text':
      validateText(object as unknown as PptxText, page, source, pageCount, diagnostics);
      break;
    case 'shape':
      validateShape(object as unknown as PptxShape, page, source, diagnostics);
      break;
    case 'table':
      validateTable(object as unknown as PptxTable, page, source, pageCount, diagnostics);
      break;
    case 'image':
      validateImage(object as unknown as PptxImage, page, source, diagnostics);
      break;
    default:
      diagnostics.push(
        error(
          'unsupported-object',
          page,
          source,
          `The ${String(object.kind)} object kind is unsupported.`,
          'Use text, shape, table or image objects.',
        ),
      );
  }
}

function validatePage(
  pageValue: unknown,
  pagePosition: number,
  deckWidth: number,
  deckHeight: number,
  pageCount: number,
  seenIds: Map<string, string>,
  seenIndexes: Set<number>,
  diagnostics: PptxDiagnostic[],
): void {
  if (!isRecord(pageValue)) {
    diagnostics.push(
      error(
        'invalid-page',
        pagePosition + 1,
        `page[${pagePosition}]`,
        'A page is not an object.',
        'Provide a page with an ID, background and object list.',
      ),
    );
    return;
  }
  const page = pageValue as unknown as PptxPage;
  const pageNumber = integer(page.index) && page.index >= 0 ? page.index + 1 : pagePosition + 1;
  const source = stringValue(page.id) && page.id ? `page:${page.id}` : `page[${pagePosition}]`;
  if (!integer(page.index) || page.index < 0)
    diagnostics.push(
      error(
        'invalid-page-index',
        pageNumber,
        source,
        'A page index must be a nonnegative integer.',
        'Preserve the source zero-based page index.',
      ),
    );
  else if (seenIndexes.has(page.index))
    diagnostics.push(
      error(
        'duplicate-page-index',
        pageNumber,
        source,
        'A page index occurs more than once.',
        'Keep each source page index unique.',
      ),
    );
  else seenIndexes.add(page.index);
  if (!stringValue(page.id) || !page.id.trim())
    diagnostics.push(
      error(
        'missing-page-id',
        pageNumber,
        source,
        'A page has no stable ID.',
        'Preserve a unique page ID.',
      ),
    );
  else if (seenIds.has(page.id))
    diagnostics.push(
      error(
        'duplicate-id',
        pageNumber,
        source,
        `The ID ${page.id} is already used by ${seenIds.get(page.id)}.`,
        'Use unique IDs for pages and objects.',
      ),
    );
  else seenIds.set(page.id, source);
  if (!validColor(page.background))
    diagnostics.push(
      error(
        'invalid-background',
        pageNumber,
        source,
        'A page background has an invalid color or opacity.',
        'Use a hex color and opacity from 0 to 1.',
      ),
    );
  if (page.notes !== undefined) {
    if (!stringValue(page.notes))
      diagnostics.push(
        error(
          'invalid-page-notes',
          pageNumber,
          source,
          'Page notes must be a string when provided.',
          'Preserve speaker notes as a string.',
        ),
      );
    else validateXml10Text(page.notes, pageNumber, `${source}/notes`, diagnostics);
  }
  if (!Array.isArray(page.objects))
    diagnostics.push(
      error(
        'invalid-page-objects',
        pageNumber,
        source,
        'A page must contain an object array.',
        'Provide native objects in paint order.',
      ),
    );
  if (Array.isArray(page.diagnostics)) diagnostics.push(...page.diagnostics);
  else
    diagnostics.push(
      error(
        'invalid-page-diagnostics',
        pageNumber,
        source,
        'A page diagnostics value must be an array.',
        'Preserve diagnostics from capture and extraction.',
      ),
    );
  if (!Array.isArray(page.objects)) return;
  page.objects.forEach((object, objectPosition) => {
    const objectSource =
      isRecord(object) && stringValue(object.source) && object.source
        ? object.source
        : `${source}/object[${objectPosition}]`;
    if (isRecord(object) && stringValue(object.id) && object.id) {
      if (seenIds.has(object.id))
        diagnostics.push(
          error(
            'duplicate-id',
            pageNumber,
            objectSource,
            `The ID ${object.id} is already used by ${seenIds.get(object.id)}.`,
            'Use unique IDs for pages and objects.',
          ),
        );
      else seenIds.set(object.id, objectSource);
    }
    validateObject(object, pageNumber, objectSource, deckWidth, deckHeight, pageCount, diagnostics);
  });
}

export function validateDeck(deck: PptxDeck): PptxDiagnostic[] {
  const diagnostics: PptxDiagnostic[] = [];
  if (!isRecord(deck)) {
    diagnostics.push(
      error(
        'invalid-deck',
        0,
        'deck',
        'The deck value is not an object.',
        'Provide a version 1 PptxDeck.',
      ),
    );
    return diagnostics;
  }
  if (deck.version !== 1 && deck.version !== 2)
    diagnostics.push(
      error(
        'unsupported-version',
        0,
        'deck',
        `Deck schema version ${String(deck.version)} is unsupported.`,
        'Use PptxDeck schema version 1 or 2.',
      ),
    );
  if (!stringValue(deck.id) || !deck.id.trim())
    diagnostics.push(
      error(
        'missing-deck-id',
        0,
        'deck',
        'The deck has no stable ID.',
        'Provide a nonempty deck ID.',
      ),
    );
  else validateXml10Text(deck.id, 0, 'deck/id', diagnostics);
  if (!stringValue(deck.title))
    diagnostics.push(
      error(
        'invalid-deck-title',
        0,
        'deck',
        'The deck title must be a string.',
        'Provide the source deck title.',
      ),
    );
  else validateXml10Text(deck.title, 0, 'deck/title', diagnostics);
  if (!finite(deck.width) || !finite(deck.height) || deck.width <= 0 || deck.height <= 0)
    diagnostics.push(
      error(
        'invalid-deck-dimensions',
        0,
        'deck',
        'Deck dimensions must be positive finite numbers.',
        'Use the canonical 1920 x 1080 pixel canvas.',
      ),
    );
  const width = finite(deck.width) && deck.width > 0 ? deck.width : 1920;
  const height = finite(deck.height) && deck.height > 0 ? deck.height : 1080;
  if (finite(deck.width) && finite(deck.height) && (deck.width !== 1920 || deck.height !== 1080))
    diagnostics.push(
      error(
        'noncanonical-canvas',
        0,
        'deck',
        'The deck dimensions differ from the canonical 1920 x 1080 canvas.',
        'Capture and extract pages at the canonical canvas size.',
      ),
    );
  if (!Array.isArray(deck.pages) || deck.pages.length === 0) {
    diagnostics.push(
      error(
        'empty-deck',
        0,
        'deck',
        'The deck has no pages.',
        'Export at least one complete page.',
      ),
    );
    return diagnostics;
  }
  const seenIds = new Map<string, string>();
  if (stringValue(deck.id) && deck.id) seenIds.set(deck.id, 'deck');
  const seenIndexes = new Set<number>();
  deck.pages.forEach((page, index) => {
    validatePage(page, index, width, height, deck.pages.length, seenIds, seenIndexes, diagnostics);
  });
  if (!diagnostics.some((entry) => entry.severity === 'error')) {
    for (const page of deck.pages) {
      if (deck.version === 1 && page.groups !== undefined) {
        diagnostics.push(
          error(
            'group-schema-version',
            page.index + 1,
            page.id,
            'Native groups require deck schema version 2.',
            'Use version 2 for grouped content.',
          ),
        );
        continue;
      }
      diagnostics.push(...planGroups(page).diagnostics);
      for (const group of page.groups ?? []) {
        if (seenIds.has(group.id))
          diagnostics.push(
            error(
              'duplicate-id',
              page.index + 1,
              group.source,
              `Group ID ${group.id} is already in use.`,
              'Use unique IDs for groups, pages and objects.',
            ),
          );
        else seenIds.set(group.id, group.source);
      }
    }
  }
  return diagnostics;
}

export { ARROW_DIRECTIONS, SUPPORTED_IMAGE_MIMES, SUPPORTED_SHAPES };
