import type { OcrDraft } from '@/types/workout';
import { participants } from './users';
import { todayInShanghai } from './dates';

const devices = ['微信运动', 'Apple 健身', 'Keep', '华为运动健康', '小米运动健康'];

export function mockRecognizeFromUrl(input: { blobUrl: string; user_id: string; nickname: string }): OcrDraft {
  const seed = Array.from(input.blobUrl).reduce((sum, char) => sum + char.charCodeAt(0), input.blobUrl.length);
  const user = participants.find((item) => item.user_id === input.user_id);
  const steps = 7000 + (seed % 12000);
  const calories = 260 + (seed % 650);
  const duration = 35 + (seed % 85);
  const distance = Math.round((steps * 0.00072 + (seed % 20) / 10) * 10) / 10;

  return {
    user_id: input.user_id,
    nickname: user?.nickname ?? input.nickname,
    date: todayInShanghai(),
    device_source: devices[seed % devices.length],
    steps,
    calories,
    duration_min: duration,
    distance_km: distance,
    weight: Math.round((58 + (seed % 280) / 10) * 10) / 10,
    screenshot_url: input.blobUrl,
    raw_ocr_text: `MOCK OCR: 识别到 ${steps} 步、${calories} kcal、${duration} 分钟、${distance} 公里。`
  };
}
