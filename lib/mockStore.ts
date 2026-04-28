import { calculateScore } from './scoring';
import { makeRecordKey, todayInShanghai } from './dates';
import type { WorkoutRecord } from '@/types/workout';

const today = todayInShanghai();
const dayMs = 24 * 60 * 60 * 1000;

const base = [
  ['u_001', '木子', 16230, 650, 92, 11.7, 66.8],
  ['u_002', '小查', 14120, 540, 76, 10.1, 82.4],
  ['u_003', '豆豆', 12100, 420, 58, 8.7, 58.9],
  ['u_004', '小馒头', 18780, 720, 105, 13.2, 75.3],
  ['u_005', '小笼包', 9800, 360, 49, 6.8, 61.2],
  ['u_006', '小杨', 15160, 590, 84, 10.9, 73.1],
  ['u_007', '老邢', 11380, 390, 56, 7.9, 86.5]
] as const;

const tysonBase = [
  ['2026-04-24', 38888, 1880, 132, 25.8, 99.8],
  ['2026-04-25', 45210, 2160, 156, 31.4, 98.9],
  ['2026-04-26', 49999, 2390, 188, 35.2, 97.7],
  ['2026-04-27', 62000, 3100, 240, 42.0, 96.2],
  [today, 88888, 5200, 360, 58.6, 94.8]
] as const;

const records: WorkoutRecord[] = base.map(([user_id, nickname, steps, calories, duration_min, distance_km, weight], index) => {
  const record = {
    id: `mock_${user_id}_${today}`,
    record_key: makeRecordKey(user_id, today),
    user_id,
    nickname,
    date: today,
    device_source: index % 2 ? 'Apple 健身' : '微信运动',
    steps,
    calories,
    duration_min,
    distance_km,
    weight,
    screenshot_url: '',
    raw_ocr_text: 'mock seed',
    confirmed: true,
    is_makeup: false,
    risk_flags: [],
    admin_status: '正常' as const,
    created_at: new Date(Date.now() - index * 3600000).toISOString(),
    score: 0
  };
  return { ...record, score: calculateScore(record) };
});

for (let i = 1; i <= 8; i += 1) {
  const date = new Date(Date.now() - i * dayMs).toISOString().slice(0, 10);
  for (const source of records.slice(0, 7)) {
    const steps = Math.max(3800, source.steps - i * 550);
    const calories = Math.max(160, Math.round(source.calories * (0.72 + i * 0.025)));
    const duration_min = Math.max(24, Math.round(source.duration_min * (0.74 + i * 0.025)));
    const record = {
      ...source,
      id: `mock_${source.user_id}_${date}`,
      record_key: makeRecordKey(source.user_id, date),
      date,
      steps,
      calories,
      duration_min,
      distance_km: Math.round(steps * 0.00072 * 10) / 10,
      weight: source.weight ? Math.round((source.weight - i * 0.08) * 10) / 10 : null,
      created_at: new Date(Date.now() - i * dayMs).toISOString()
    };
    records.push({ ...record, score: calculateScore(record) });
  }
}

for (const [date, steps, calories, duration_min, distance_km, weight] of tysonBase) {
  const record = {
    id: `mock_u_demo_tyson_${date}`,
    record_key: makeRecordKey('u_demo_tyson', date),
    user_id: 'u_demo_tyson',
    nickname: '拳王泰森',
    date,
    device_source: '其他',
    steps,
    calories,
    duration_min,
    distance_km,
    weight,
    screenshot_url: '',
    raw_ocr_text: 'mock tyson seed',
    confirmed: true,
    is_makeup: false,
    risk_flags: ['步数超过5万', '热量超过2000kcal'],
    admin_status: '正常' as const,
    created_at: new Date(`${date}T22:30:00+08:00`).toISOString(),
    score: 0
  };
  records.push({ ...record, score: calculateScore(record) });
}

export const mockStore = {
  async listRecords() {
    return [...records].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async createRecord(record: WorkoutRecord) {
    records.unshift({ ...record, id: `mock_${record.record_key}` });
    return record;
  }
};
