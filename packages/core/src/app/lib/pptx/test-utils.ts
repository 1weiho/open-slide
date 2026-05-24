import { strFromU8, unzipSync } from 'fflate';

export async function unzipPptx(blob: Blob): Promise<Record<string, Uint8Array>> {
  return unzipSync(new Uint8Array(await blob.arrayBuffer()));
}

export async function readPptxXml(blob: Blob, path: string): Promise<string> {
  const zip = await unzipPptx(blob);
  const file = zip[path];
  if (!file) {
    throw new Error(`Missing PPTX part: ${path}`);
  }
  return strFromU8(file);
}
