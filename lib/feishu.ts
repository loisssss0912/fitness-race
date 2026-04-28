import axios from 'axios';
import { mockStore } from './mockStore';
import { todayInShanghai } from './dates';
import type { OcrDraft, WorkoutRecord } from '@/types/workout';

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

async function feishuRequest<T>(method: 'get' | 'post' | 'patch', path: string, data?: unknown) {
  const token = await getTenantAccessToken();
  const response = await axios.request<T>({
    method,
    url: `https://open.feishu.cn/open-apis${path}`,
    headers: { Authorization: `Bearer ${token}` },
    data
  });
  return response.data;
}

async function feishuUpload<T>(path: string, formData: FormData) {
  const token = await getTenantAccessToken();
  const response = await axios.post<T>(`https://open.feishu.cn/open-apis${path}`, formData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

function dateToTimestamp(date: string) {
  return new Date(`${date}T00:00:00+08:00`).getTime();
}

function dateTimeToTimestamp(value: string) {
  return new Date(value).getTime();
}

function timestampToDate(value: unknown) {
  if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10);
  return String(value ?? '');
}

function timestampToISOString(value: unknown) {
  if (typeof value === 'number') return new Date(value).toISOString();
  return String(value ?? '');
}

function normalizeDeviceSource(value: string) {
  if (value.includes('Apple') || value.includes('苹果')) return '苹果';
  if (value.includes('华为')) return '华为';
  if (value.includes('小米')) return '小米';
  if (value.includes('微信')) return '微信运动';
  if (value.includes('Keep')) return 'Keep';
  return '其他';
}

function parseRiskFlags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const raw = String(value ?? '');
  return raw ? raw.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function toFields(record: WorkoutRecord) {
  const now = new Date().toISOString();
  const riskLevel = record.risk_flags.length ? '异常' : '正常';

  return {
    record_key: record.record_key,
    user_id: record.user_id,
    nickname: record.nickname,
    date: dateToTimestamp(record.date),
    submit_date: dateToTimestamp(now.slice(0, 10)),
    device_source: normalizeDeviceSource(record.device_source),
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
    risk_flags: record.risk_flags,
    risk_level: riskLevel,
    admin_status: record.admin_status,
    created_at: dateTimeToTimestamp(record.created_at),
    updated_at: dateTimeToTimestamp(now)
  };
}

function toConfirmFields(record: WorkoutRecord) {
  return toFields(record);
}

function textField(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'text' in item) return String(item.text);
      return String(item);
    }).join('');
  }
  return String(value ?? '');
}

function numberField(value: unknown, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumberField(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = textField(value).trim();
    if (text) return text;
  }
  return '';
}

type RawOcrJson = {
  steps?: unknown;
  calories?: unknown;
  duration_min?: unknown;
  distance_km?: unknown;
  weight?: unknown;
  date?: unknown;
  device_source?: unknown;
};

function parseRawOcrJson(value: unknown): RawOcrJson | null {
  const raw = textField(value).trim();
  if (!raw) return null;

  const unfenced = raw
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(unfenced.slice(start, end + 1));
    return parsed && typeof parsed === 'object' ? parsed as RawOcrJson : null;
  } catch {
    return null;
  }
}

function fromFeishuRecord(item: { record_id: string; fields: Record<string, unknown> }): WorkoutRecord {
  const f = item.fields;
  const riskFlags = parseRiskFlags(f.risk_flags);
  return {
    id: item.record_id,
    record_key: textField(f.record_key),
    user_id: textField(f.user_id),
    nickname: textField(f.nickname),
    date: timestampToDate(f.date),
    device_source: textField(f.device_source),
    steps: Number(f.steps ?? 0),
    calories: Number(f.calories ?? 0),
    duration_min: Number(f.duration_min ?? 0),
    distance_km: Number(f.distance_km ?? 0),
    weight: f.weight === undefined || f.weight === null || f.weight === '' ? null : Number(f.weight),
    score: Number(f.score ?? 0),
    screenshot_url: textField(f.screenshot_url),
    raw_ocr_text: textField(f.raw_ocr_text),
    confirmed: Boolean(f.confirmed),
    is_makeup: Boolean(f.is_makeup),
    risk_flags: riskFlags,
    admin_status: String(f.admin_status ?? '正常') as WorkoutRecord['admin_status'],
    created_at: timestampToISOString(f.created_at)
  };
}

function ocrDraftFromFields(recordId: string, fields: Record<string, unknown>): OcrDraft | null {
  const rawJson = parseRawOcrJson(fields.raw_ocr_text);
  const steps = numberField(fields.ocr_steps, numberField(rawJson?.steps, numberField(fields.steps)));
  const calories = numberField(fields.ocr_calories, numberField(rawJson?.calories, numberField(fields.calories)));
  const duration = numberField(fields.ocr_duration_min, numberField(rawJson?.duration_min, numberField(fields.duration_min)));
  const distance = numberField(fields.ocr_distance_km, numberField(rawJson?.distance_km, numberField(fields.distance_km)));
  const hasCoreMetrics = steps > 0 || calories > 0 || duration > 0 || distance > 0;
  if (!hasCoreMetrics) return null;

  return {
    draft_record_id: recordId,
    user_id: textField(fields.user_id),
    nickname: textField(fields.nickname),
    date: firstText(timestampToDate(fields.ocr_date ?? fields.date), rawJson?.date, todayInShanghai()),
    device_source: firstText(fields.ocr_device_source, rawJson?.device_source, fields.device_source, '其他'),
    steps,
    calories,
    duration_min: duration,
    distance_km: distance,
    weight: nullableNumberField(fields.ocr_weight) ?? nullableNumberField(rawJson?.weight) ?? nullableNumberField(fields.weight),
    screenshot_url: textField(fields.screenshot_url),
    raw_ocr_text: textField(fields.raw_ocr_text),
    ocr_status: textField(fields.ocr_status) === '识别失败' ? '识别失败' : '已识别'
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

  async updateRecord(recordId: string, record: WorkoutRecord) {
    if (useMock) return mockStore.createRecord({ ...record, id: recordId });

    const result = await feishuRequest<{ code: number; msg?: string; data: { record: { record_id: string } } }>(
      'patch',
      `/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records/${recordId}`,
      { fields: toConfirmFields(record) }
    );

    if (result.code !== 0) throw new Error(`Feishu update record error: ${result.msg || result.code}`);
    return { ...record, id: result.data.record.record_id };
  },

  async getRecord(recordId: string) {
    const result = await feishuRequest<{
      code: number;
      msg?: string;
      data: { record?: { record_id: string; fields: Record<string, unknown> }; item?: { record_id: string; fields: Record<string, unknown> } };
    }>('get', `/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records/${recordId}`);

    if (result.code !== 0) throw new Error(`Feishu get record error: ${result.msg || result.code}`);
    return result.data.record ?? result.data.item ?? null;
  },

  async uploadMedia(file: File) {
    const buffer = await file.arrayBuffer();
    const formData = new FormData();
    formData.append('file_name', file.name);
    formData.append('parent_type', 'bitable_image');
    formData.append('parent_node', config.appToken ?? '');
    formData.append('size', String(file.size));
    formData.append('file', new Blob([buffer], { type: file.type || 'application/octet-stream' }), file.name);

    const result = await feishuUpload<{ code: number; msg?: string; data?: { file_token?: string } }>(
      '/drive/v1/medias/upload_all',
      formData
    );

    if (result.code !== 0 || !result.data?.file_token) throw new Error(`Feishu upload media error: ${result.msg || result.code}`);
    return result.data.file_token;
  },

  async createOcrDraft(input: { user_id: string; nickname: string; file: File }) {
    if (useMock) {
      return {
        recordId: `mock_${Date.now()}`,
        status: 'mock'
      };
    }

    const fileToken = await this.uploadMedia(input.file);
    const now = new Date().toISOString();
    const today = todayInShanghai();
    const fields = {
      record_key: `draft_${input.user_id}_${Date.now()}`,
      user_id: input.user_id,
      nickname: input.nickname,
      date: dateToTimestamp(today),
      submit_date: dateToTimestamp(today),
      screenshot_attachment: [{ file_token: fileToken, name: input.file.name }],
      screenshot_url: '',
      raw_ocr_text: '等待飞书 OCR 字段识别附件',
      confirmed: false,
      is_makeup: false,
      risk_flags: [],
      risk_level: '待确认',
      admin_status: '正常',
      ocr_status: '待识别',
      created_at: dateTimeToTimestamp(now),
      updated_at: dateTimeToTimestamp(now)
    };

    const result = await feishuRequest<{ code: number; msg?: string; data: { record: { record_id: string } } }>(
      'post',
      `/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`,
      { fields }
    );

    if (result.code !== 0) throw new Error(`Feishu create OCR draft error: ${result.msg || result.code}`);
    return { recordId: result.data.record.record_id, status: 'pending' };
  },

  async getOcrDraft(recordId: string) {
    if (useMock) return null;

    const record = await this.getRecord(recordId);
    if (!record) return { status: 'failed' as const, message: '找不到飞书记录。' };

    const status = textField(record.fields.ocr_status);
    if (status === '识别失败') return { status: 'failed' as const, message: textField(record.fields.raw_ocr_text) || '飞书 OCR 识别失败。' };

    const draft = ocrDraftFromFields(record.record_id, record.fields);
    if (!draft) return { status: 'pending' as const, message: '等待飞书 OCR 字段写入识别结果。' };
    return { status: 'ready' as const, draft };
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
