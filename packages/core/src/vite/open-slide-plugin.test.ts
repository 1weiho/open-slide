import { describe, expect, it } from 'vitest';
import { type OpenSlidePluginOptions, openSlidePlugin } from './open-slide-plugin.ts';

const CONFIG_ID = '\0virtual:open-slide/config';

async function loadVirtualConfig(
  options: Partial<OpenSlidePluginOptions> & Pick<OpenSlidePluginOptions, 'config'>,
  command: 'serve' | 'build',
) {
  const plugin = openSlidePlugin({
    userCwd: process.cwd(),
    ...options,
  });

  if (typeof plugin.config === 'function') {
    await plugin.config({}, { command, mode: command === 'serve' ? 'development' : 'production' });
  }

  if (typeof plugin.load !== 'function') {
    throw new Error('expected plugin load hook');
  }

  const load = plugin.load as (this: unknown, id: string) => string | Promise<string | null> | null;
  const code = await load.call(undefined, CONFIG_ID);
  if (typeof code !== 'string') {
    throw new Error('expected virtual config module');
  }

  const json = code.match(/^export default (.*);\n$/)?.[1];
  if (!json) {
    throw new Error(`unexpected virtual config module: ${code}`);
  }

  return JSON.parse(json);
}

describe('openSlidePlugin config module', () => {
  it('enables downloads by default during development', async () => {
    const config = await loadVirtualConfig({ config: {} }, 'serve');

    expect(config.build.allowHtmlDownload).toBe(true);
    expect(config.build.allowPptxDownload).toBe(true);
  });

  it('enables downloads by default during production builds', async () => {
    const config = await loadVirtualConfig({ config: {} }, 'build');

    expect(config.build.allowHtmlDownload).toBe(true);
    expect(config.build.allowPptxDownload).toBe(true);
  });

  it('preserves production pptx download overrides', async () => {
    const config = await loadVirtualConfig(
      {
        config: {
          build: {
            allowPptxDownload: false,
          },
        },
      },
      'build',
    );

    expect(config.build.allowPptxDownload).toBe(false);
  });
});
