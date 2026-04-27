'use client';

import type { EChartsOption } from 'echarts';
import { Activity, Flame, Footprints, Weight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Chart } from '@/components/Chart';
import { UserAvatar } from '@/components/UserAvatar';
import type { WorkoutRecord } from '@/types/workout';

export default function ProfileClient({ userId }: { userId: string }) {
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const latest = records[records.length - 1];

  useEffect(() => {
    fetch(`/api/profile/${userId}`).then((res) => res.json()).then((data) => setRecords(data.records));
  }, [userId]);

  const option = useMemo<EChartsOption>(() => {
    const dates = records.map((item) => item.date.slice(5));
    return {
      color: ['#0a84ff', '#ff9f0a', '#30d158'],
      tooltip: { trigger: 'axis' },
      grid: [
        { left: 56, right: 28, top: 32, height: 86 },
        { left: 56, right: 28, top: 158, height: 86 },
        { left: 56, right: 28, top: 284, height: 86 }
      ],
      xAxis: [
        { type: 'category', gridIndex: 0, data: dates, axisLabel: { show: false } },
        { type: 'category', gridIndex: 1, data: dates, axisLabel: { show: false } },
        { type: 'category', gridIndex: 2, data: dates, axisLabel: { color: '#ffffff80' } }
      ],
      yAxis: [
        { type: 'value', gridIndex: 0, name: '步', nameTextStyle: { color: '#ffffff80' }, axisLabel: { color: '#ffffff80' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.10)' } } },
        { type: 'value', gridIndex: 1, name: 'kcal', nameTextStyle: { color: '#ffffff80' }, axisLabel: { color: '#ffffff80' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.10)' } } },
        { type: 'value', gridIndex: 2, name: 'kg', scale: true, nameTextStyle: { color: '#ffffff80' }, axisLabel: { color: '#ffffff80' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.10)' } } }
      ],
      series: [
        { name: '步数', type: 'line', xAxisIndex: 0, yAxisIndex: 0, smooth: true, data: records.map((item) => item.steps), areaStyle: { opacity: 0.12 } },
        { name: '热量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, barWidth: 14, data: records.map((item) => item.calories), itemStyle: { borderRadius: [8, 8, 0, 0] } },
        { name: '体重', type: 'line', xAxisIndex: 2, yAxisIndex: 2, smooth: true, data: records.map((item) => item.weight ?? null) }
      ]
    };
  }, [records]);

  return (
    <div className="space-y-5">
      <section className="panel p-6">
        <div className="flex items-center gap-4">
          <UserAvatar name={latest?.nickname ?? userId} size="lg" />
          <div>
            <p className="text-sm text-ocean">个人战绩</p>
            <h2 className="text-4xl font-black">{latest?.nickname ?? userId}</h2>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="步数" value={(latest?.steps ?? 0).toLocaleString()} unit="步" icon={Footprints} />
        <Metric label="热量" value={String(latest?.calories ?? 0)} unit="kcal" icon={Flame} />
        <Metric label="体重" value={String(latest?.weight ?? 0)} unit="kg" icon={Weight} />
      </section>
      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black">趋势曲线</h3>
          <Activity className="text-ocean" />
        </div>
        <Chart option={option} className="h-[430px]" />
      </section>
    </div>
  );
}

function Metric(props: { label: string; value: string; unit: string; icon: typeof Footprints }) {
  const Icon = props.icon;
  return (
    <div className="panel p-5">
      <Icon className="text-ocean" />
      <p className="mt-3 text-sm text-white/50">{props.label}</p>
      <p className="mt-1 text-3xl font-black">{props.value}</p>
      <p className="text-sm text-white/40">{props.unit}</p>
    </div>
  );
}
