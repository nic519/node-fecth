import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Copy, Bookmark } from 'lucide-react';
import { useToastContext } from '@/providers/toast-provider';

interface RegisterSuccessDialogProps {
  uid: string;
  token: string;
}

export function RegisterSuccessDialog({ uid, token }: RegisterSuccessDialogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToastContext();
  const [isOpen, setIsOpen] = useState(() => searchParams.get('new') === 'true');

  // Detect if user just registered (based on URL param)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      // Clean up URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('new');
      router.replace(`?${params.toString()}`);
    }
  }, [searchParams, router]);

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const subUrl = `${origin}/api/x?uid=${uid}&token=${token}`;
    navigator.clipboard.writeText(subUrl).then(() => {
      showToast('订阅链接已复制到剪贴板', 'success');
    });
  };

  const configUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/config?uid=${uid}&token=${token}`
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] border-border/60 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">您的专属订阅链接已生成</DialogTitle>
        </DialogHeader>


        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 flex gap-3 items-start">
          <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">请务必收藏本页</h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
              1. 出于隐私保护，我们未收集您的任何联系方式。这是找回配置的唯一入口，请立即按下 <kbd className="font-mono bg-amber-100 dark:bg-amber-800/50 px-1 rounded text-amber-900 dark:text-amber-100">Ctrl+D</kbd> 或 <kbd className="font-mono bg-amber-100 dark:bg-amber-800/50 px-1 rounded text-amber-900 dark:text-amber-100">Cmd+D</kbd> 收藏本页面。

            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
              2. 账号如果在两个月内未活跃，则会自动被清除
            </p>
          </div>

        </div>

        <div className="flex justify-center mt-4">
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto min-w-[120px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20"
          >
            <CheckCircle2 className=" h-6 w-6" />
            我知道了
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
