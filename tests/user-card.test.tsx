import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { UserCard } from '@/app/admin/users/components/UserCard';
import type { UserAdminConfig } from '@/modules/user/admin.schema';

const user: UserAdminConfig = {
  uid: 'tingfeng',
  accessToken: 'test-token',
  updatedAt: '',
  appendSubList: [{
    type: 'inline',
    subscribe: '',
    flag: '自建节点',
    proxiesYaml: '- {name: private-node, type: direct}',
  }],
  subscriptionStats: [],
};

const renderCard = (config: UserAdminConfig) => renderToStaticMarkup(
  <UserCard user={config} onUserAction={async () => {}} />,
);

test('UserCard displays manually configured proxy sources without a missing snapshot message', () => {
  const markup = renderCard(user);

  expect(markup).toContain('自建节点');
  expect(markup).toContain('手动代理');
  expect(markup).toContain('不提供流量数据');
  expect(markup).not.toContain('暂无附加订阅流量快照');
  expect(markup).not.toContain('private-node');
});

test('UserCard keeps remote traffic details alongside manual sources without an aggregate block', () => {
  const markup = renderCard({
    ...user,
    subscriptionStats: [{
      type: 'append',
      name: '远程订阅',
      url: 'https://example.com/sub',
      traffic: 'upload=0; download=1073741824; total=10737418240',
    }],
  });

  expect(markup).toContain('远程订阅');
  expect(markup).toContain('10.0%');
  expect(markup).toContain('已用');
  expect(markup).toContain('自建节点');
  expect(markup).not.toContain('合计剩余');
  expect(markup).not.toContain('个远程订阅有流量快照');
});

test('UserCard shows an empty state only when no subscription sources are configured', () => {
  const markup = renderCard({ ...user, appendSubList: [] });

  expect(markup).toContain('暂无附加订阅');
  expect(markup).not.toContain('手动代理');
});
