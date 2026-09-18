import { appName } from '@/lib/shared';
import { renderSocialImage } from '@/lib/social-image';

export const alt = 'Autono — a slide framework built for agents';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return renderSocialImage({
    title: appName,
    description: 'A slide framework built for agents.',
    breadcrumb: 'Slides',
    section: 'Slides',
  });
}
