'use client';

import { cn } from '@/lib/utils';
import { Activity, Globe, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Node {
  id: string;
  name: string;
  protocol: string;
  network: string;
  latency: number | 'timeout';
  flag: string;
}

const initialNodes: Node[] = [
  { id: '1', name: '[Any]HK 01', protocol: 'AnyTLS', network: 'udp', latency: 99, flag: '🇭🇰' },
  { id: '2', name: '[Any]HK 02', protocol: 'AnyTLS', network: 'udp', latency: 130, flag: '🇭🇰' },
  { id: '3', name: '[Any]HK 03', protocol: 'AnyTLS', network: 'udp', latency: 138, flag: '🇭🇰' },
  { id: '4', name: '[Hy2]HK 01', protocol: 'Hysteria2', network: 'udp', latency: 'timeout', flag: '🇭🇰' },
  { id: '5', name: '[Hy2]HK 02', protocol: 'Hysteria2', network: 'udp', latency: 'timeout', flag: '🇭🇰' },
  { id: '6', name: '[Hy2]HK 03', protocol: 'Hysteria2', network: 'udp', latency: 'timeout', flag: '🇭🇰' },
  { id: '7', name: '[三网]HK 01', protocol: 'AnyTLS', network: 'udp', latency: 102, flag: '🇭🇰' },
  { id: '8', name: '[三网]HK 02', protocol: 'Trojan', network: 'udp', latency: 84, flag: '🇭🇰' },
  { id: '9', name: '[三网]HK 03', protocol: 'AnyTLS', network: 'udp', latency: 329, flag: '🇭🇰' },
  { id: '10', name: '[三网]HK 04', protocol: 'AnyTLS', network: 'udp', latency: 163, flag: '🇭🇰' },
  { id: '11', name: '[trojan] 香港 01', protocol: 'Trojan', network: 'udp', latency: 105, flag: '🐙' },
  { id: '12', name: '[trojan] 香港 02', protocol: 'Trojan', network: 'udp', latency: 84, flag: '🐙' },
  { id: '13', name: '[trojan] 香港 03', protocol: 'Trojan', network: 'udp', latency: 137, flag: '🐙' },
  { id: '14', name: '[trojan] 香港 04', protocol: 'Trojan', network: 'udp', latency: 100, flag: '🐙' },
  { id: '15', name: '[trojan] 香港 05', protocol: 'Trojan', network: 'udp', latency: 94, flag: '🐙' },
  { id: '16', name: '[trojan] 香港 06', protocol: 'Trojan', network: 'udp', latency: 362, flag: '🐙' },
];

export function LatencyDemo() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedId, setSelectedId] = useState<string>('8'); // Initially select one with low latency

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => {
          // 10% chance to change latency
          if (Math.random() > 0.9) {
            // 5% chance to timeout
            if (Math.random() > 0.95) {
              return { ...node, latency: 'timeout' as const };
            }
            // Otherwise random latency between 80 and 400
            return { ...node, latency: Math.floor(Math.random() * (400 - 80) + 80) };
          }
          return node;
        });

        // Find best node (lowest latency that isn't timeout)
        let bestNodeId = selectedId;
        let minLatency = Infinity;

        newNodes.forEach(node => {
          if (node.latency !== 'timeout' && typeof node.latency === 'number') {
            if (node.latency < minLatency) {
              minLatency = node.latency;
              bestNodeId = node.id;
            }
          }
        });

        if (bestNodeId !== selectedId) {
          setSelectedId(bestNodeId);
        }

        return newNodes;
      });
    }, 2000); // Update every 2 seconds to make it look alive

    return () => clearInterval(interval);
  }, [selectedId]);

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div className="w-full rounded-xl overflow-hidden bg-card border border-border shadow-2xl font-mono text-sm">
      {/* Header Bar */}
      <div className="bg-muted/30 px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2 text-foreground">
          <span className="font-bold">[自动]-香港</span>
          <span className="text-red-500">🇭🇰</span>
          <span className="text-muted-foreground">URLTest</span>
          {selectedNode && (
            <>
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
              <span className="text-muted-foreground">{selectedNode.name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1 bg-background px-2 py-1 rounded border border-border">
            <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></span>
            <span>30</span>
          </div>
          <Zap className="w-4 h-4" />
          <Globe className="w-4 h-4" />
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {nodes.map((node) => {
          const isSelected = node.id === selectedId;
          const isTimeout = node.latency === 'timeout';

          return (
            <div
              key={node.id}
              className={cn(
                "relative p-3 rounded-lg border transition-all duration-200 cursor-default select-none",
                isSelected
                  ? "bg-muted/55 border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.2)] dark:shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
                  : "bg-muted/35 border-transparent hover:bg-muted/50",
              )}
            >
              {/* Header Row: Icon + Name */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                  {node.flag}
                </div>
                <div className="text-foreground font-medium truncate text-xs flex-1">
                  {node.name}
                </div>
              </div>

              {/* Footer Row: Protocol + Latency */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground/70">
                  <span>{node.protocol}</span>
                  <span>{node.network}</span>
                </div>
                <div className={cn(
                  "font-bold font-mono",
                  isTimeout ? "text-destructive" :
                    (node.latency as number) < 100 ? "text-green-600 dark:text-green-400" :
                      (node.latency as number) < 200 ? "text-amber-600 dark:text-amber-400" : "text-destructive"
                )}>
                  {isTimeout ? '超时' : node.latency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
