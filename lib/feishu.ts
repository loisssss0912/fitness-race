import axios from 'axios';
import { mockStore } from './mockStore';
import type { WorkoutRecord } from '@/types/workout';

const config = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  appToken: process.env.FEISHU_APP_TOKEN,
  tableId: process.env.FEISHU_TABLE_ID,
  useMock: process.env.USE_MOCK_FEISHU === 'true'
};

const useMock = config.useMock || !config.appId || !config.appSecret || !config.appToken || !config.tableId;
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getTenantAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: config.appId,
    app_secret: config.appSecret
  });

  if (response.data.code !== 0) {
    throw new Error(`Feishu token error: ${response.data.msg || response.data.code}`);
  }

  cachedToken = {
    value: response.data.tenant_access_token,
    expiresAt: Date.now() + (response.data.expire - 120) * 1000
  };
  return cachedToken.value;
}

async function feishuRequest<T>(method: 'get' | 'post', path: string, data?: unknown) {
  const token = await getTenantAccessToken();
  const response = await axios.request<T>({
    method,
    url: `https://open.feishu.cn/open-apis${path}`,
    headers: { Authorization: `Bearer ${token}` },
    data
  });
  return response.data;
}

function toFields(record: WorkoutRecord) {
  return {
    record_key: record.record_key,
    user_id: record.user_id,
    nickname: record.nickname,
    date: record.date,
    device_source: record.device_source,
    steps: record.steps,
    calories: record.calories,
    duration_min: record.duration_min,
    distance_km: record.distance_km,
    weight: record.weight ?? null,
    score: record.score,
    screenshot_url: record.screenshot_url,
    raw_ocr_text: record.raw_ocr_text,
    confirmed: record.confirmed,
    is_makeup: record.is_makeup,
    risk_flags: record.risk_flags.join(', '),
    admin_status: record.admin_status,
    created_at: record.created_at
  };
}

function fromFeishuRecord(item: { record_id: string; fields: Record<string, unknown> }): WorkoutRecord {
  const f = item.fields;
  const riskRaw = String(f.risk_flags ?? '');
  return {
    id: item.record_id,
    record_key: String(f.record_key ?? ''),
    user_id: String(f.user_id ?? ''),
    nickname: String(f.nickname ?? ''),
    date: String(f.date ?? ''),
    device_source: String(f.device_source ?? ''),
    steps: Number(f.steps ?? 0),
    calories: Number(f.calories ?? 0),
    duration_min: Number(f.duration_min ?? 0),
    distance_km: Number(f.distance_km ?? 0),
    weight: f.weight === undefined || f.weight === null || f.weight === '' ? null : Number(f.weight),
    score: Number(f.score ?? 0),
    screenshot_url: String(f.screenshot_url ?? ''),
    raw_ocr_text: String(f.raw_ocr_text ?? ''),
    confirmed: Boolean(f.confirmed),
    is_makeup: Boolean(f.is_makeup),
    risk_flags: riskRaw ? riskRaw.split(',').map((item) => item.trim()).filter(Boolean) : [],
    admin_status: String(f.admin_status ?? '正常') as WorkoutRecord['admin_status'],
    created_at: String(f.created_at ?? '')
  };
}

export const feishu = {
  isMock: useMock,

  async listRecords(): Promise<WorkoutRecord[]> {
    if (useMock) return mockStore.listRecords();

    const rows: WorkoutRecord[] = [];
    let pageToken = '';

    do {
      const query = new URLSearchParams({ page_size: '100' });
      if (pageToken) query.set('page_token', pageToken);

      const result = await feishuRequest<{
        code: number;
        msg?: string;
        data: {
          has_more: boolean;
          page_token?: string;
          items: Array<{ record_id: string; fields: Record<string, unknown> }>;
        };
      }>('get', `/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?${query.toString()}`);

      if (result.code !== 0) throw new Error(`Feishu list records error: ${result.msg || result.code}`);
      rows.push(...result.data.items.map(fromFeishuRecord));
      pageToken = result.data.page_token ?? '';
      if (!result.data.has_more) break;
    } while (pageToken);

    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createRecord(record: WorkoutRecord) {
    if (useMock) return mockStore.createRecord(record);

    const result = await feishuRequest<{ code: number; msg?: string; data: { record: { record_id: string } } }>(
      'post',
      `/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`,
      { fields: toFields(record) }
    );

    if (result.code !== 0) throw new Error(`Feishu create record error: ${result.msg || result.code}`);
    return { ...record, id: result.data.record.record_id };
  },

  async findByRecordKey(recordKey: string) {
    const rows = await this.listRecords();
    return rows.find((record) => record.record_key === recordKey) ?? null;
  },

  async latestValidRecord(userId: string, beforeDate?: string) {
    const rows = await this.listRecords();
    return (
      rows
        .filter((record) => record.user_id === userId && record.confirmed && record.admin_status !== '剔除')
        .filter((record) => (beforeDate ? record.date < beforeDate : true))
        .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
    );
  }
};
