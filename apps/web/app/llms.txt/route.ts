import { llms } from 'fumadocs-core/source';
import { source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  return new Response(await llms(source).index());
}
