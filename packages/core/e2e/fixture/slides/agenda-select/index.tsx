import type { Page, SlideMeta } from '@open-slide/core';
import { Agenda } from '../../components/agenda';

export const meta: SlideMeta = {
  title: 'Agenda Select',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const Only: Page = () => (
  <Agenda>
    <span>What changed?</span>
    <span>What did it expose?</span>
  </Agenda>
);

export default [Only] satisfies Page[];
