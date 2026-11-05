'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AcmeLogo } from '@/components/NavigationBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLoginForm({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? '登录失败，请稍后重试。');
      }
      window.location.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试。');
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-8">
      <section className="surface w-full max-w-sm rounded-2xl p-6 sm:p-8" aria-labelledby="admin-login-title">
        <div className="mb-6 flex items-center gap-3">
          <AcmeLogo />
          <h1 id="admin-login-title" className="text-xl font-semibold">后台登录</h1>
        </div>
        <form className="space-y-4" method="post" onSubmit={login}>
          <div className="space-y-2">
            <Label htmlFor="admin-password">管理员密码</Label>
            <Input id="admin-password" name="password" type="password" autoComplete="current-password" required disabled={busy} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? '登录中…' : '登录'}</Button>
        </form>
        <Link href="/" className="mt-5 inline-block text-sm text-muted-foreground hover:text-foreground">返回首页</Link>
      </section>
    </main>
  );
}
