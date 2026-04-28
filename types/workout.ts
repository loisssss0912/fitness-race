export type AdminStatus = '正常' | '已修正' | '剔除';

export type Participant = {
  user_id: string;
  nickname: string;
};

export type WorkoutRecord = {
  id?: string;
  record_key: string;
  user_id: string;
  nickname: string;
  date: string;
  device_source: string;
  steps: number;
  calories: number;
  duration_min: number;
  distance_km: number;
  weight?: number | null;
  score: number;
  screenshot_url: string;
  raw_ocr_text: string;
  confirmed: boolean;
  is_makeup: boolean;
  risk_flags: string[];
  admin_status: AdminStatus;
  created_at: string;
};

export type OcrDraft = Omit<
  WorkoutRecord,
  'id' | 'record_key' | 'score' | 'confirmed' | 'is_makeup' | 'risk_flags' | 'admin_status' | 'created_at'
> & {
  draft_record_id?: string;
};

export type OcrStartResponse = {
  recordId: string;
  status: string;
  draft?: OcrDraft;
};

export type OcrStatusResponse = {
  recordId: string;
  status: 'pending' | 'ready' | 'failed';
  message?: string;
  draft?: OcrDraft;
};

export type DashboardResponse = {
  today: string;
  todayRanking: WorkoutRecord[];
  weekRanking: WorkoutRecord[];
  streakRanking: Array<Participant & { streak: number }>;
};
