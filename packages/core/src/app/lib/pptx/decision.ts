export type PptxExportDecision =
  | { kind: 'native'; reason?: string }
  | { kind: 'native-reduced'; reason: string }
  | { kind: 'raster'; reason: string }
  | { kind: 'omitted'; reason: string };
