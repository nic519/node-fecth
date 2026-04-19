import Link from 'next/link';
import { ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface AccessDeniedStateProps {
  eyebrow: string;
  title: string;
  message: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function AccessDeniedState({
  eyebrow,
  title,
  message,
  secondaryHref,
  secondaryLabel,
}: AccessDeniedStateProps) {
  return (
    <main className="min-h-screen bg-slate-50/50 text-foreground dark:bg-zinc-950">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white opacity-20 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] pointer-events-none dark:bg-zinc-950 dark:[background:radial-gradient(125%_125%_at_50%_10%,#09090b_40%,#1e1b4b_100%)]" />

      <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <div className="w-full max-w-xl">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>

          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
            {message}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                返回首页
              </Link>
            </Button>
            {secondaryHref && secondaryLabel ? (
              <Button variant="outline" asChild>
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
