'use client';

import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Activity, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LazyChart } from '@/components/LazyChart';
import { UserAvatar } from '@/components/UserAvatar';
import type { DashboardResponse, WorkoutRecord } from '@/types/workout';

const rankStyles: Array<{ row: string; badge: string; score: string; label: string }> = [
  {
    row: 'border-[#ffd166]/40 bg-[linear-gradient(135deg,rgba(255,209,102,.20),rgba(255,143,171,.085)_34%,rgba(13,17,27,.82)_72%)]',
    badge: 'border-[#ffe8a3]/70 bg-[linear-gradient(135deg,#ffd166,#ff8fab_58%,#7dd3fc)] text-[#211200] shadow-[#ffd166]/25',
    score: 'text-[#ffe08a]',
    label: '冠军'
  },
  {
    row: 'border-[#7dd3fc]/32 bg-[linear-gradient(135deg,rgba(125,211,252,.16),rgba(167,139,250,.08)_36%,rgba(13,17,27,.84)_74%)]',
    badge: 'border-[#bae6fd]/55 bg-[linear-gradient(135deg,#7dd3fc,#a78bfa_58%,#f0abfc)] text-[#061525] shadow-[#7dd3fc]/20',
    score: 'text-[#aee9ff]',
    label: '狠人'
  },
  {
    row: 'border-[#fca5a5]/30 bg-[linear-gradient(135deg,rgba(252,165,165,.155),rgba(253,186,116,.08)_36%,rgba(13,17,27,.84)_74%)]',
    badge: 'border-[#fecaca]/55 bg-[linear-gradient(135deg,#fca5a5,#fdba74_58%,#fde68a)] text-[#240707] shadow-[#fca5a5]/18',
    score: 'text-[#ffc4c4]',
    label: '硬卷'
  },
  {
    row: 'border-[#86efac]/28 bg-[linear-gradient(135deg,rgba(134,239,172,.14),rgba(94,234,212,.07)_36%,rgba(13,17,27,.85)_74%)]',
    badge: 'border-[#bbf7d0]/50 bg-[linear-gradient(135deg,#86efac,#5eead4_58%,#93c5fd)] text-[#061709] shadow-[#86efac]/16',
    score: 'text-[#b6f7ca]',
    label: '冲刺'
  },
  {
    row: 'border-[#c4b5fd]/28 bg-[linear-gradient(135deg,rgba(196,181,253,.14),rgba(249,168,212,.07)_36%,rgba(13,17,27,.85)_74%)]',
    badge: 'border-[#ddd6fe]/50 bg-[linear-gradient(135deg,#c4b5fd,#f9a8d4_58%,#fef3c7)] text-[#160b2b] shadow-[#c4b5fd]/16',
    score: 'text-[#dcd3ff]',
    label: '稳住'
  },
  {
    row: 'border-[#f9a8d4]/28 bg-[linear-gradient(135deg,rgba(249,168,212,.135),rgba(240,171,252,.07)_36%,rgba(13,17,27,.85)_74%)]',
    badge: 'border-[#fbcfe8]/50 bg-[linear-gradient(135deg,#f9a8d4,#f0abfc_58%,#a5b4fc)] text-[#240818] shadow-[#f9a8d4]/16',
    score: 'text-[#ffc7e4]',
    label: '追赶'
  },
  {
    row: 'border-[#fdba74]/28 bg-[linear-gradient(135deg,rgba(253,186,116,.135),rgba(254,240,138,.07)_36%,rgba(13,17,27,.85)_74%)]',
    badge: 'border-[#fed7aa]/50 bg-[linear-gradient(135deg,#fdba74,#fef08a_58%,#86efac)] text-[#211006] shadow-[#fdba74]/16',
    score: 'text-[#ffd0a0]',
    label: '危险'
  }
];

const middleRankLabels = [
  '卷王预备',
  '燃脂机器',
  '暴汗选手',
  '步数刺客',
  '热量杀手',
  '跑到冒烟',
  '有点东西',
  '不服来战',
  '差点封神',
  '还在输出',
  '继续加码',
  '别停下来',
  '今日狠活',
  '快追上了',
  '明天再卷'
];

function getRankLabel(index: number, total: number) {
  if (index === 0) return '冠军';
  if (total > 1 && index === total - 1) return '你是垃圾';
  return middleRankLabels[(index - 1) % middleRankLabels.length];
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then((res) => res.json()).then(setData);
  }, []);

  const dailyOption = useMemo<EChartsOption>(() => {
    const rows = data?.todayRanking ?? [];
    return {
      grid: { left: 48, right: 72, top: 48, bottom: 34 },
      legend: { top: 0, textStyle: { color: '#ffffff90' } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: rows.map((item) => item.nickname), axisLabel: { color: '#ffffff80' } },
      dataZoom: rows.length > 8 ? [{ type: 'inside', start: 0, end: Math.min(100, Math.round((8 / rows.length) * 100)) }] : undefined,
      yAxis: [
        { type: 'value', name: 'kcal/min', nameTextStyle: { color: '#ffffff80' }, axisLabel: { color: '#ffffff80' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.10)' } } },
        { type: 'value', name: '步', nameTextStyle: { color: '#ffffff80' }, axisLabel: { color: '#ffffff80', formatter: (v: number) => `${Math.round(v / 1000)}k` }, splitLine: { show: false } }
      ],
      series: [
        { name: '热量', type: 'bar', data: rows.map((item) => item.calories), barWidth: 22, itemStyle: { borderRadius: [12, 12, 0, 0], color: '#ff9f0a' } },
        { name: '时长', type: 'line', smooth: true, data: rows.map((item) => item.duration_min), lineStyle: { width: 3, color: '#bf5af2' } },
        { name: '步数', type: 'line', smooth: true, yAxisIndex: 1, data: rows.map((item) => item.steps), lineStyle: { width: 3, color: '#30d158' } }
      ]
    };
  }, [data]);

  return (
    <div className="space-y-5">
      <section className="panel relative min-h-[360px] overflow-hidden p-6" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.18), rgba(0,0,0,.58)), url('/hero-bg.jpg') center / cover no-repeat" }}>
        <div className="relative max-w-2xl pt-24 sm:pt-28">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime-400/16 px-3 py-1 text-sm font-semibold text-lime-100 ring-1 ring-lime-300/20">
            <Sparkles size={15} />
            今日擂台 · {data?.today ?? '加载中'}
          </p>
          <h2 className="text-5xl font-black tracking-tight text-white sm:text-7xl">谁是垃圾</h2>
          <p className="mt-4 max-w-xl text-lg font-semibold text-white/70">今天不上榜，明天被嘲笑。上传截图，现场开卷。</p>
          <Link href="/upload" className="btn-primary mt-7">
            上传运动截图
          </Link>
        </div>
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">今日消耗：热量 / 时长 / 步数</h2>
          <Activity className="text-coral" size={22} />
        </div>
        <LazyChart option={dailyOption} className="h-80" delayMs={900} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Ranking title="今日排行榜" records={data?.todayRanking ?? []} />
        <Ranking title="本周排行榜" records={data?.weekRanking ?? []} />
        <section className="panel p-5">
          <h2 className="mb-4 text-lg font-black text-white">连续打卡榜</h2>
          <div className="space-y-3">
            {(data?.streakRanking ?? []).map((item, index) => (
              <div key={item.user_id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/7 p-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={item.nickname} index={index} size="sm" />
                  <div>
                    <p className="font-black">{item.nickname}</p>
                    <p className="text-xs text-white/45">{item.user_id}</p>
                  </div>
                </div>
                <p className="text-xl font-black text-mint">{item.streak} 天</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function Ranking({ title, records }: { title: string; records: WorkoutRecord[] }) {
  const panelRef = useRef<HTMLElement>(null);
  const [feedMotion, setFeedMotion] = useState<CSSProperties>({});

  useEffect(() => {
    const updateMotion = () => {
      const panel = panelRef.current;
      const start = panel?.querySelector<HTMLElement>('[data-feed-start="true"]');
      const target = panel?.querySelector<HTMLElement>('[data-feed-target="true"]');
      if (!panel || !start || !target) return;

      const panelBox = panel.getBoundingClientRect();
      const startBox = start.getBoundingClientRect();
      const targetBox = target.getBoundingClientRect();
      const startX = startBox.left + startBox.width / 2 - panelBox.left - 14;
      const startY = startBox.top + startBox.height / 2 - panelBox.top - 12;
      const targetX = targetBox.left + targetBox.width / 2 - panelBox.left - 22;
      const targetY = targetBox.top + targetBox.height / 2 - panelBox.top - 14;

      setFeedMotion({
        left: `${startX}px`,
        top: `${startY}px`,
        '--feed-x': `${targetX - startX}px`,
        '--feed-y': `${targetY - startY}px`
      } as CSSProperties);
    };

    updateMotion();
    window.addEventListener('resize', updateMotion);
    const timer = window.setTimeout(updateMotion, 250);
    return () => {
      window.removeEventListener('resize', updateMotion);
      window.clearTimeout(timer);
    };
  }, [records]);

  return (
    <section ref={panelRef} className="panel relative overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="mt-1 text-xs font-semibold text-white/45">运动分 = 步数20 + 热量40 + 时长40</p>
        </div>
        <Trophy className="text-ocean" size={22} />
      </div>
      {records.length > 1 && (
        <div
          className="poop-feed pointer-events-none absolute z-40"
          style={feedMotion}
          aria-hidden="true"
        >
          <span className="poop-feed-spoon">🥄</span>
          <span className="poop-feed-pile">
            <span className="poop-feed-poop">💩</span>
            <span className="poop-feed-poop poop-feed-poop-extra">💩</span>
            <span className="poop-feed-poop poop-feed-poop-third">💩</span>
          </span>
        </div>
      )}
      <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
        {records.map((record, index) => {
          const rankStyle = rankStyles[index % rankStyles.length];
          const isFirst = index === 0;
          const isLast = records.length > 1 && index === records.length - 1;
          const rankLabel = getRankLabel(index, records.length);
          return (
            <Link
              key={`${record.record_key}-${index}`}
              href={`/profile/${record.user_id}`}
              className={`rank-row relative flex min-h-[76px] items-center gap-3 rounded-3xl border p-3 transition hover:-translate-y-0.5 ${
                isFirst
                  ? `rank-first ${rankStyle.row}`
                  : isLast
                  ? 'border-white/12 bg-white/[0.045]'
                    : record.risk_flags.length
                      ? 'risk'
                      : `${rankStyle.row} hover:bg-white/11`
              }`}
            >
              {isFirst && (
                <>
                  <div className="champion-burst" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </>
              )}
              {isLast && (
                <>
                  <div className="feed-target absolute left-[84px] top-1/2 z-30 -translate-y-1/2" data-feed-target="true" aria-hidden="true" />
                </>
              )}
              <div className={`rank-badge relative grid h-12 w-12 place-items-center rounded-2xl border text-base font-black shadow-lg ${rankStyle.badge}`}>
                {index + 1}
              </div>
              <div className={isFirst ? 'champion-avatar relative rounded-full' : 'relative'} data-feed-start={isFirst ? 'true' : undefined}>
                <UserAvatar name={record.nickname} index={index} size="sm" />
              </div>
              <div className="relative min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-black text-white">{record.nickname}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                    isFirst
                      ? 'border-amber-200/40 bg-amber-300/16 text-amber-100'
                      : isLast
                      ? 'border-rose-300/30 bg-rose-400/14 text-rose-100'
                      : 'border-white/12 bg-white/10 text-white/65'
                  }`}>{rankLabel}</span>
                </div>
                <p className="text-xs text-white/50">{record.steps.toLocaleString()} 步 · {record.calories} kcal · {record.duration_min} 分钟</p>
              </div>
              <div className="relative text-right">
                <p className={`text-xl font-black ${rankStyle.score}`}>{record.score}</p>
                <p className="text-xs text-white/40">运动分</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
