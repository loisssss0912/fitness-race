'use client';

import { CheckCircle2, ImagePlus, Loader2, Save } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { compressImage } from '@/lib/clientImage';
import { participants as defaultParticipants } from '@/lib/users';
import type { OcrDraft, OcrStartResponse, OcrStatusResponse, Participant, WorkoutRecord } from '@/types/workout';

const IDENTITY_CACHE_KEY = 'fitness_race_identity';

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = typeof json.message === 'string' ? json.message : `${fallbackMessage}，状态码 ${response.status}`;
    throw new Error(message);
  }
  return json as T;
}

function readCachedIdentity(participants: Participant[]) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(IDENTITY_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { user_id?: string; invite_code?: string };
    return participants.find((item) => (
      item.user_id === cached.user_id &&
      item.invite_code &&
      item.invite_code.toUpperCase() === cached.invite_code?.toUpperCase()
    )) ?? null;
  } catch {
    return null;
  }
}

function cacheIdentity(user: Participant) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(IDENTITY_CACHE_KEY, JSON.stringify({
    user_id: user.user_id,
    nickname: user.nickname,
    invite_code: user.invite_code
  }));
}

export default function UploadClient() {
  const [participants, setParticipants] = useState<Participant[]>(defaultParticipants);
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [invite, setInvite] = useState('');
  const [identityUnlocked, setIdentityUnlocked] = useState(false);
  const [preview, setPreview] = useState('');
  const [draft, setDraft] = useState<OcrDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState('');
  const [saved, setSaved] = useState<WorkoutRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/participants')
      .then((res) => res.json())
      .then((data) => {
        const nextParticipants = Array.isArray(data.participants) && data.participants.length ? data.participants : defaultParticipants;
        setParticipants(nextParticipants);
        const cached = readCachedIdentity(nextParticipants);
        if (cached) unlockIdentity(cached);
      })
      .catch(() => {
        setParticipants(defaultParticipants);
        const cached = readCachedIdentity(defaultParticipants);
        if (cached) unlockIdentity(cached);
      });
  }, []);

  function unlockIdentity(user: Participant) {
    setUserId(user.user_id);
    setNickname(user.nickname);
    setIdentityUnlocked(true);
    setInvite(user.invite_code ?? '');
    setDraft((current) => (current ? { ...current, user_id: user.user_id, nickname: user.nickname } : current));
  }

  function applyInvite() {
    const code = invite.trim().toUpperCase();
    if (!code) return;
    const user = participants.find((item) => item.invite_code?.toUpperCase() === code);
    if (!user) {
      setError('邀请码不正确，请确认后再试。');
      return;
    }
    setError('');
    unlockIdentity(user);
    cacheIdentity(user);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!identityUnlocked || !userId || !nickname) {
      setError('请先输入邀请码解锁身份，再上传截图。');
      event.target.value = '';
      return;
    }
    setLoading(true);
    setOcrMessage('正在上传到飞书多维表格...');
    setError('');
    setSaved(null);
    try {
      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed));
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('user_id', userId);
      formData.append('nickname', nickname);
      const started = await fetch('/api/ocr/start', {
        method: 'POST',
        body: formData
      }).then((res) => readJson<OcrStartResponse>(res, '图片上传到飞书失败'));

      if (started.draft) {
        setDraft(started.draft);
        setOcrMessage('');
        return;
      }

      setOcrMessage('飞书 OCR 识别中，通常需要几秒到十几秒...');
      for (let index = 0; index < 20; index += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
        const status = await fetch(`/api/ocr/status?recordId=${started.recordId}`).then((res) => readJson<OcrStatusResponse>(res, '读取 OCR 状态失败'));
        if (status.status === 'ready' && status.draft) {
          setDraft(status.draft);
          setOcrMessage('');
          return;
        }
        if (status.status === 'failed') throw new Error(status.message || '飞书 OCR 识别失败');
      }
      throw new Error('飞书 OCR 暂未返回结果。请确认多维表格里已把 screenshot_attachment 配置为 OCR/智能提取来源，并把结果写入 ocr_* 字段。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof OcrDraft>(key: K, value: OcrDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setLoading(true);
    setError('');
    try {
      const payload: OcrDraft = {
        draft_record_id: draft.draft_record_id,
        user_id: draft.user_id,
        nickname: draft.nickname,
        date: draft.date,
        device_source: draft.device_source,
        steps: Number(draft.steps),
        calories: Number(draft.calories),
        duration_min: Number(draft.duration_min),
        distance_km: Number(draft.distance_km),
        weight: draft.weight === null || draft.weight === undefined ? null : Number(draft.weight),
        screenshot_url: draft.screenshot_url ?? '',
        raw_ocr_text: draft.raw_ocr_text ?? ''
      };
      const response = await fetch('/api/records/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await readJson<WorkoutRecord>(response, '提交失败');
      setSaved(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
      <section className="panel p-5">
        <h2 className="text-xl font-black">验证身份</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_210px]">
          <div className="flex min-w-0 gap-2">
            <input className="input" placeholder="输入邀请码" value={invite} onChange={(event) => setInvite(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyInvite();
              }
            }} />
            <button type="button" className="btn-secondary w-28 shrink-0 px-4" onClick={applyInvite}>验证</button>
          </div>
          <div className={`input flex items-center ${identityUnlocked ? 'select-gold' : 'text-white/35'}`}>
            {identityUnlocked ? nickname : '输入邀请码后显示身份'}
          </div>
        </div>
        <label className="mt-5 flex min-h-[310px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/18 bg-white/6 p-6 text-center transition hover:border-blue-400/50 hover:bg-blue-500/8">
          {preview ? <img src={preview} alt="运动截图预览" className="max-h-[360px] rounded-[28px] object-contain shadow-2xl" /> : (
            <>
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-ocean ring-1 ring-white/10"><ImagePlus size={30} /></div>
              <p className="text-lg font-black">选择运动截图</p>
              <p className="mt-2 text-sm text-white/50">图片会先压缩，再上传到飞书附件字段等待 OCR。</p>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        {loading && <p className="mt-4 flex items-center gap-2 text-ocean"><Loader2 className="animate-spin" size={18} />{ocrMessage || '处理中'}</p>}
        {error && <p className="mt-4 rounded-2xl bg-red-500/12 p-4 text-red-300">{error}</p>}
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">确认数据</h2>
          {saved && <CheckCircle2 className="text-mint" />}
        </div>
        {!draft ? <div className="rounded-[28px] bg-white/6 p-10 text-center text-white/50">上传后进入确认页，确认后才写入飞书。</div> : (
          <form onSubmit={confirm} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="昵称" value={draft.nickname} onChange={(v) => update('nickname', v)} />
              <Field label="日期" type="date" value={draft.date} onChange={(v) => update('date', v)} />
              <Field label="设备来源" value={draft.device_source} onChange={(v) => update('device_source', v)} />
              <Field label="步数" type="number" value={draft.steps} onChange={(v) => update('steps', Number(v))} />
              <Field label="热量 kcal" type="number" value={draft.calories} onChange={(v) => update('calories', Number(v))} />
              <Field label="时长 min" type="number" value={draft.duration_min} onChange={(v) => update('duration_min', Number(v))} />
              <Field label="距离 km" type="number" step="0.1" value={draft.distance_km} onChange={(v) => update('distance_km', Number(v))} />
              <Field label="体重 kg" type="number" step="0.1" value={draft.weight ?? ''} onChange={(v) => update('weight', v === '' ? null : Number(v))} />
            </div>
            <textarea className="input min-h-24" value={draft.raw_ocr_text} onChange={(event) => update('raw_ocr_text', event.target.value)} />
            <button className="btn-primary" disabled={loading}><Save size={18} />确认入库</button>
            {saved && <p className="rounded-2xl bg-green-500/12 p-4 text-green-300">已写入：{saved.nickname}，运动分 {saved.score}</p>}
          </form>
        )}
      </section>
    </div>
  );
}

function Field(props: { label: string; value: string | number; type?: string; step?: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/55">{props.label}</span>
      <input className="input" type={props.type ?? 'text'} step={props.step} value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </label>
  );
}
