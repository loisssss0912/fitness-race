'use client';

import { upload } from '@vercel/blob/client';
import { CheckCircle2, ImagePlus, Loader2, Save } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { compressImage } from '@/lib/clientImage';
import { participants as defaultParticipants } from '@/lib/users';
import type { OcrDraft, Participant, WorkoutRecord } from '@/types/workout';

export default function UploadClient() {
  const [participants, setParticipants] = useState<Participant[]>(defaultParticipants);
  const [userId, setUserId] = useState('u_001');
  const [nickname, setNickname] = useState('木子');
  const [invite, setInvite] = useState('');
  const [preview, setPreview] = useState('');
  const [draft, setDraft] = useState<OcrDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<WorkoutRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/participants')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.participants) && data.participants.length) {
          setParticipants(data.participants);
        }
      })
      .catch(() => setParticipants(defaultParticipants));
  }, []);

  function pickUser(id: string) {
    const user = participants.find((item) => item.user_id === id);
    setUserId(id);
    const nextNickname = user?.nickname ?? nickname;
    setNickname(nextNickname);
    setDraft((current) => (current ? { ...current, user_id: id, nickname: nextNickname } : current));
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setSaved(null);
    try {
      const compressed = await compressImage(file);
      setPreview(URL.createObjectURL(compressed));
      const blob = await upload(`screenshots/${Date.now()}-${compressed.name}`, compressed, {
        access: 'public',
        handleUploadUrl: '/api/blob'
      });
      const ocr = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blobUrl: blob.url, user_id: userId, nickname })
      }).then((res) => res.json());
      setDraft(ocr);
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
      const response = await fetch('/api/records/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || '提交失败');
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
        <h2 className="text-xl font-black">选择身份</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select className="input" value={userId} onChange={(event) => pickUser(event.target.value)}>
            {participants.map((item) => <option key={item.user_id} value={item.user_id}>{item.nickname}</option>)}
          </select>
          <input className="input" placeholder="邀请码，可选" value={invite} onChange={(event) => setInvite(event.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {participants.map((item) => (
            <button
              key={item.user_id}
              type="button"
              onClick={() => pickUser(item.user_id)}
              className={`rounded-full border px-3 py-2 text-sm font-black transition ${
                userId === item.user_id
                  ? 'border-[#ffd166]/60 bg-[#ffd166]/18 text-[#ffe08a] shadow-lg shadow-[#ffd166]/10'
                  : 'border-white/10 bg-white/7 text-white/70 hover:bg-white/12'
              }`}
            >
              {item.nickname}
            </button>
          ))}
        </div>
        <label className="mt-5 flex min-h-[310px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/18 bg-white/6 p-6 text-center transition hover:border-blue-400/50 hover:bg-blue-500/8">
          {preview ? <img src={preview} alt="运动截图预览" className="max-h-[360px] rounded-[28px] object-contain shadow-2xl" /> : (
            <>
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-ocean ring-1 ring-white/10"><ImagePlus size={30} /></div>
              <p className="text-lg font-black">选择运动截图</p>
              <p className="mt-2 text-sm text-white/50">图片会先压缩，再上传到 Vercel Blob。</p>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        {loading && <p className="mt-4 flex items-center gap-2 text-ocean"><Loader2 className="animate-spin" size={18} />处理中</p>}
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
