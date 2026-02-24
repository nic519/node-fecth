'use client';

import { useState, useEffect } from 'react';
import { UserConfig } from '@/types/user-config';
import { adminService } from '@/services/admin-api';
import { useToastContext } from '@/providers/toast-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Key, Link as LinkIcon, Dices, Loader2 } from 'lucide-react';

interface RegisterUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  superToken?: string;
  onSuccess?: () => void;
}

export function RegisterUserDialog({
  isOpen,
  onOpenChange,
  superToken,
  onSuccess
}: RegisterUserDialogProps) {
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);

  // Form state
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');
  const [subscribe, setSubscribe] = useState('');

  // Generate token when dialog opens
  useEffect(() => {
    if (isOpen && !token) {
      generateRandomToken();
    }
    if (!isOpen) {
      // Reset form on close if needed, or keep state
      // For now, let's clear on close to be safe
      setUid('');
      setToken('');
      setSubscribe('');
    }
  }, [isOpen]);

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setToken(result);
  };

  const handleRegister = async () => {
    if (!uid.trim() || !token.trim() || !subscribe.trim()) {
      showToast('请填写完整的用户信息', 'error');
      return;
    }

    setLoading(true);
    try {
      const userConfig: UserConfig = {
        subscribe: subscribe.trim(),
        accessToken: token.trim(),
      };

      // TODO: Implement public registration endpoint logic here
      // If superToken is present, use admin API
      // If not, use public API (to be implemented)

      let response: { code: number; msg?: string; data?: unknown };
      if (superToken) {
        response = await adminService.addUser(superToken, {
          uid: uid.trim(),
          config: userConfig
        });
      } else {
        // Temporary: Fallback or error if no superToken until public API is ready
        // For now, we'll assume this is only called with superToken or we need the new API
        // But to unblock the UI task, we'll try to call a new endpoint we'll create
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: uid.trim(),
            config: userConfig
          })
        });
        response = await res.json();
      }

      if (response.code === 0) {
        showToast(`用户 ${uid} 创建成功`, 'success');
        onOpenChange(false);
        onSuccess?.();
        // Clear form
        setUid('');
        setToken('');
        setSubscribe('');
      } else {
        showToast('创建用户失败: ' + (response.msg || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      showToast('创建用户失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/60 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
            {superToken ? '注册新用户' : '立即注册'}
          </DialogTitle>
          <DialogDescription className="text-center">
            请输入新用户的详细信息以创建账号
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="uid" className="text-sm font-medium">用户ID</Label>
            <div className="relative group">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="uid"
                className="pl-9 border-border/60 focus-visible:ring-primary/20 transition-all"
                placeholder="请输入用户ID"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token" className="text-sm font-medium">访问令牌</Label>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="token"
                  className="pl-9 border-border/60 focus-visible:ring-primary/20 transition-all"
                  placeholder="请输入用户访问令牌"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomToken}
                title="生成随机令牌"
                className="shrink-0 border-border/60 hover:bg-muted/50 hover:text-primary transition-colors"
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscribe" className="text-sm font-medium">订阅链接</Label>
            <div className="relative group">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="subscribe"
                className="pl-9 border-border/60 focus-visible:ring-primary/20 transition-all"
                placeholder="请输入订阅源链接"
                value={subscribe}
                onChange={(e) => setSubscribe(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleRegister}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/20"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认创建
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
