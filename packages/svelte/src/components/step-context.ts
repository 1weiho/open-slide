import type { EntryDirection, StepRegistry } from '@open-slide/shared';

export const STEP_CONTEXT = 'open-slide:step-host';

export type StepContext = {
  entryDirection: EntryDirection;
  register: StepRegistry['register'];
};
