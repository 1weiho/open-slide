import type { Page, SlideMeta } from '@open-slide/core';
import { Card, Heading } from '../../components/shared';

export const meta: SlideMeta = {
  title: 'Shared Select',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const Only: Page = () => (
  <>
    <Heading>Shared heading click target</Heading>
    <Card>
      <Heading>Nested shared heading</Heading>
    </Card>
  </>
);

export default [Only] satisfies Page[];
