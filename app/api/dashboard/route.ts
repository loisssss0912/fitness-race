import { NextResponse } from 'next/server';
import { startOfWeek, todayInShanghai } from '@/lib/dates';
import { feishu } from '@/lib/feishu';
import type { DashboardResponse, WorkoutRecord } from '@/types/workout';

const DASHBOARD_CACHE_MS = 60_000;
let cachedDashboard: { data: DashboardResponse; expiresAt: number } | null = null;

const cacheHeaders = {
  'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
};

function valid(record: WorkoutRecord) {
  return record.confirmed && record.admin_status !== '剔除';
}

function bestPerUser(records: WorkoutRecord[]) {
  const map = new Map<string, WorkoutRecord>();
  for (const record of records) {
    const current = map.get(record.user_id);
    if (!current || record.score > current.score) map.set(record.user_id, record);
  }
  return [...map.values()].sort((a, b) => b.score - a.score);
}

function cumulativeRanking(records: WorkoutRecord[]) {
  const map = new Map<string, WorkoutRecord>();
  for (const record of records) {
    const current = map.get(record.user_id);
    if (!current) map.set(record.user_id, { ...record });
    else {
      current.steps += record.steps;
      current.calories += record.calories;
      current.duration_min += record.duration_min;
      current.distance_km = Math.round((current.distance_km + record.distance_km) * 10) / 10;
      current.score = Math.round((current.score + record.score) * 10) / 10;
    }
  }
  return [...map.values()].sort((a, b) => b.score - a.score);
}

export async function GET() {
  const now = Date.now();
  if (cachedDashboard && cachedDashboard.expiresAt > now) {
    return NextResponse.json(cachedDashboard.data, { headers: cacheHeaders });
  }

  const rows = (await feishu.listRecords()).filter(valid);
  const today = todayInShanghai();
  const weekStart = startOfWeek(today);

  const todayRows = rows.filter((record) => record.date === today);
  const weekRows = rows.filter((record) => record.date >= weekStart);

  const data = {
    today,
    todayRanking: bestPerUser(todayRows),
    weekRanking: cumulativeRanking(weekRows),
    totalRanking: cumulativeRanking(rows)
  };

  cachedDashboard = {
    data,
    expiresAt: now + DASHBOARD_CACHE_MS
  };

  return NextResponse.json(data, { headers: cacheHeaders });
}
