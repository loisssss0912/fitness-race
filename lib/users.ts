import type { Participant } from '@/types/workout';

export const participants: Participant[] = [
  { user_id: 'u_001', nickname: '木子', invite_code: 'ROLLING2026001' },
  { user_id: 'u_002', nickname: '小查', invite_code: 'ROLLING2026002' },
  { user_id: 'u_003', nickname: '豆豆', invite_code: 'ROLLING2026003' },
  { user_id: 'u_004', nickname: '小馒头', invite_code: 'ROLLING2026004' },
  { user_id: 'u_005', nickname: '小笼包', invite_code: 'ROLLING2026005' },
  { user_id: 'u_006', nickname: '小杨', invite_code: 'ROLLING2026006' },
  { user_id: 'u_007', nickname: '老邢', invite_code: 'ROLLING2026007' },
  { user_id: 'u_demo_tyson', nickname: '拳王泰森', invite_code: 'ROLLING2026008' }
];

export function findParticipant(userId: string) {
  return participants.find((item) => item.user_id === userId);
}
