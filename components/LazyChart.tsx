'use client';

import type { EChartsOption } from 'echarts';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Chart = dynamic(() => import('@/components/Chart').then((mod) => mod.Chart), {
  ssr: false
});

export function LazyChart({ option, className = 'h-72', delayMs = 700 }: { option: EChartsOption; className?: string; delayMs?: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  if (!ready) {
    return (
      <div className={`${className} grid place-items-center rounded-3xl border border-white/10 bg-white/[0.035] text-sm font-bold text-white/40`}>
        图表加载中
      </div>
    );
  }

  return <Chart option={option} className={className} />;
}
