import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExpiryBadge } from '@/components/ExpiryBadge';

const now = Date.UTC(2026, 10, 9);
const day = 86_400_000;

test.each([
  [-2, '已过期 2 天', 'bg-muted'],
  [0.5, '不足 1 天', 'bg-destructive/10'],
  [7, '剩余 7 天', 'bg-destructive/10'],
  [20, '剩余 20 天', 'bg-amber-500/10'],
  [60, '剩余 60 天', 'bg-emerald-500/10'],
] as const)('expiry badge for %s days uses the matching label and urgency color', (days, label, color) => {
  const markup = renderToStaticMarkup(<ExpiryBadge dateMs={now + days * day} now={now} showDate />);
  expect(markup).toContain(label);
  expect(markup).toContain(color);
  expect(markup).toContain('<time dateTime=');
  expect(markup).toContain('到期时间');
});
