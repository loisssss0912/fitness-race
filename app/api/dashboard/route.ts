import { NextResponse } from 'next/server';
import { startOfWeek, todayInShanghai } from '@/lib/dates';
import { feishu } from '@/lib/feishu';
import { participants } from '@/lib/users';
import type { WorkoutRecord } from '@/types/workout';

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

function streakForUser(records: WorkoutRecord[], userId: string) {
  const dates = new Set(records.filter((record) => record.user_id === userId).map((record) => record.date));
  let count = 0;
  const cursor = new Date(`${todayInShanghai()}T00:00:00+08:00`);
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export async function GET() {
  const rows = (await feishu.listRecords()).filter(valid);
  const today = todayInShanghai();
  const weekStart = startOfWeek(today);

  const todayRows = rows.filter((record) => record.date === today);
  const weekRows = rows.filter((record) => record.date >= weekStart);
  const userMap = new Map(participants.map((user) => [user.user_id, user]));
  for (const record of rows) {
    if (!userMap.has(record.user_id)) {
      userMap.set(record.user_id, { user_id: record.user_id, nickname: record.nickname });
    }
  }

  const streakRanking = [...userMap.values()]
    .map((user) => ({ ...user, streak: streakForUser(rows, user.user_id) }))
    .sort((a, b) => b.streak - a.streak);

  return NextResponse.json({
    today,
    todayRanking: bestPerUser(todayRows),
    weekRanking: cumulativeRanking(weekRows),
    streakRanking
  });
}
