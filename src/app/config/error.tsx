'use client';

export default function ConfigError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-foreground dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-xl border border-border/60 bg-background p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold">配置页加载失败</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {error.message || "发生了未知错误。"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          重试
        </button>
      </div>
    </div>
  );
}
