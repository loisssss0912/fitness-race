import type { Participant } from '@/types/workout';

export const participants: Participant[] = [
  { user_id: 'u_001', nickname: '木子' },
  { user_id: 'u_002', nickname: '小查' },
  { user_id: 'u_003', nickname: '豆豆' },
  { user_id: 'u_004', nickname: '小馒头' },
  { user_id: 'u_005', nickname: '小笼包' },
  { user_id: 'u_006', nickname: '小杨' },
  { user_id: 'u_007', nickname: '老邢' }
];

export function findParticipant(userId: string) {
  return participants.find((item) => item.user_id === userId);
}
