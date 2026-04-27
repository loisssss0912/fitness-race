import type { WorkoutRecord } from '@/types/workout';

export function getRiskFlags(input: {
  steps: number;
  calories: number;
  weight?: number | null;
  previousRecord?: WorkoutRecord | null;
}) {
  const flags: string[] = [];

  if (input.steps > 50000) flags.push('步数超过5万');
  if (input.calories > 2000) flags.push('热量超过2000kcal');

  const prevWeight = input.previousRecord?.weight;
  if (typeof input.weight === 'number' && typeof prevWeight === 'number' && Math.abs(input.weight - prevWeight) > 2) {
    flags.push('体重波动超过2kg');
  }

  return flags;
}

export function isRisky(record: Pick<WorkoutRecord, 'risk_flags'>) {
  return record.risk_flags.length > 0;
}
