import { EditablePptxError, type PptxDeck } from './model';
import { writePptxWithReport } from './write';

self.onmessage = async (event: MessageEvent<PptxDeck>) => {
  try {
    self.postMessage(await writePptxWithReport(event.data));
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
      diagnostics: error instanceof EditablePptxError ? error.diagnostics : undefined,
    });
  }
};
