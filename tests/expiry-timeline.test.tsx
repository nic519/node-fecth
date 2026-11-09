import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExpiryTimeline } from '@/components/ExpiryTimeline';

const day = 86_400_000;

test('timeline sorts upcoming expiries first, includes distant events and keeps expired entries last', () => {
  const now = Date.now();
  const events = [
    { id: 'past', title: 'Expired source', dateMs: now - 2 * day },
    { id: 'far', title: 'Distant source', dateMs: now + 400 * day },
    { id: 'soon', title: 'Soon source', dateMs: now + 2 * day },
  ];
  const markup = renderToStaticMarkup(<ExpiryTimeline events={events} />);
  expect(markup.indexOf('Soon source')).toBeLessThan(markup.indexOf('Distant source'));
  expect(markup.indexOf('Distant source')).toBeLessThan(markup.indexOf('Expired source'));
  expect(markup).toContain('已过期 2 天');
  expect(events[0].id).toBe('past');
});

test('same-day subscriptions share a date marker and sub-day expiry is explicit', () => {
  const now = Date.now();
  const events = [
    { id: 'a', title: 'Source A', dateMs: now + 60_000, subtitle: '剩余 8 GB' },
    { id: 'b', title: 'Source B', dateMs: now + 60_000 },
  ];
  const markup = renderToStaticMarkup(<ExpiryTimeline events={events} />);
  expect(markup.match(/<time /g)).toHaveLength(1);
  expect(markup).toContain('不足 1 天');
  expect(markup).toContain('剩余 8 GB');
});

test('timeline provides an empty state', () => {
  expect(renderToStaticMarkup(<ExpiryTimeline events={[]} />)).toContain('暂无订阅到期信息');
});
