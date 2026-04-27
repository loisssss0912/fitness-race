'use client';

import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

export function Chart({ option, className = 'h-72' }: { option: EChartsOption; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} className={className} />;
}
