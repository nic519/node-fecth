import { SyncItemCard } from '@/components/SyncItemCard';
import type { SyncItemData, SyncStatus, DynamicInfo } from '@/app/config/hooks/useDynamicSync';

// Static preview data
const previewSyncItems: SyncItemData[] = [
  { url: 'https://sub.nodefetch.io/sub1', source: '主订阅', flag: '🐙' },
  { url: 'https://sub.nodefetch.io/sub2', source: '追加订阅', flag: '🍚' },
  { url: 'https://sub.nodefetch.io/sub3', source: '追加订阅', flag: '🍌' }
];

const previewStatuses: Record<string, SyncStatus> = {
  'https://sub.nodefetch.io/sub1': { status: 'success', message: '流量紧张' },
  'https://sub.nodefetch.io/sub2': { status: 'success', message: '流量充足' },
  'https://sub.nodefetch.io/sub3': { status: 'success', message: '流量充足' }
};

const previewInfos: Record<string, DynamicInfo> = {
  'https://sub.nodefetch.io/sub1': {
    id: 'demo-main',
    url: 'https://sub.nodefetch.io/main',
    traffic: 'upload=402653184;download=307904819200;expire=1779780995;total=336870912000',
    updatedAt: '2026-02-21T02:10:00.000Z',
  },
  'https://sub.nodefetch.io/sub2': {
    id: 'demo-japan',
    url: 'https://sub.nodefetch.io/japan',
    traffic: 'upload=536870912;download=19984954560;expire=1779780995;total=85899345920',
    updatedAt: '2026-02-21T00:05:00.000Z'
  },
  'https://sub.nodefetch.io/sub3': {
    id: 'demo-backup',
    url: 'https://sub.nodefetch.io/backup',
    traffic: 'upload=134217728;download=72805306368;expire=1779780995;total=102400000000',
    updatedAt: '2026-02-21T01:30:00.000Z'
  }
};

export function SyncPreviewGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-12">
      {previewSyncItems.map((item) => (
        <SyncItemCard
          key={item.url}
          item={item}
          status={previewStatuses[item.url] || { status: 'idle' }}
          info={previewInfos[item.url]}
          showAction={false}
        />
      ))}
    </div>
  );
}
