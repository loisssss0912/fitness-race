export function calculateScore(input: { steps: number; calories: number; duration_min: number; confirmed?: boolean }) {
  const stepScore = Math.min(input.steps / 15000, 1) * 20;
  const calorieScore = Math.min(input.calories / 600, 1) * 40;
  const durationScore = Math.min(input.duration_min / 90, 1) * 40;
  return Math.round((stepScore + calorieScore + durationScore) * 10) / 10;
}
