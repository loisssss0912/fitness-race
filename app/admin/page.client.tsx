'use client';

import { Database, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UserAvatar } from '@/components/UserAvatar';
import type { WorkoutRecord } from '@/types/workout';

export default function AdminClient() {
  const [records, setRecords] = useState<WorkoutRecord[]>([]);

  async function load() {
    const rows = await fetch('/api/records').then((res) => res.json());
    setRecords(rows);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <section className="panel p-5">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/12 px-3 py-1 text-sm font-semibold text-ocean ring-1 ring-blue-400/20">
          <Database size={15} />
          数据核对
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">飞书入库记录</h2>
            <p className="mt-2 text-sm text-white/55">管理员主要在飞书多维表格中修正异常数据；前端仅负责读取最新结果。</p>
          </div>
          <button className="btn-secondary" onClick={load}><RefreshCw size={18} />刷新</button>
        </div>
      </section>

      <section className="panel overflow-hidden p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-white/45">
              <tr>
                <th className="px-3 py-2">用户</th>
                <th className="px-3 py-2">日期</th>
                <th className="px-3 py-2">步数</th>
                <th className="px-3 py-2">热量</th>
                <th className="px-3 py-2">体重</th>
                <th className="px-3 py-2">补交</th>
                <th className="px-3 py-2">风险</th>
                <th className="px-3 py-2">管理员状态</th>
                <th className="px-3 py-2">分数</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record.record_key} className={record.risk_flags.length ? 'risk' : 'bg-white/7'}>
                  <td className="rounded-l-[20px] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={record.nickname} index={index} size="sm" />
                      <div>
                        <Link href={`/profile/${record.user_id}`} className="font-black hover:text-ocean">{record.nickname}</Link>
                        <p className="text-xs text-white/35">{record.user_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{record.date}</td>
                  <td className="px-3 py-3">{record.steps.toLocaleString()}</td>
                  <td className="px-3 py-3">{record.calories}</td>
                  <td className="px-3 py-3">{record.weight ?? '-'}</td>
                  <td className="px-3 py-3">{record.is_makeup ? '是' : '否'}</td>
                  <td className="px-3 py-3">{record.risk_flags.join('、') || '-'}</td>
                  <td className="px-3 py-3">{record.admin_status}</td>
                  <td className="rounded-r-[20px] px-3 py-3 font-black text-ocean">{record.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
