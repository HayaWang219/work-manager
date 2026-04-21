'use client';
import { useState, useEffect } from 'react';
import type { CalendarEvent } from '@/lib/types';

export default function CalendarStrip() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch('/api/google/events?days=1');
      if (res.status === 401) { setConnected(false); setLoading(false); return; }
      const data = await res.json();
      setEvents(data.events ?? []);
      setCached(data.cached ?? false);
    } catch {
      setConnected(false);
    }
    setLoading(false);
  }

  useEffect(() => { fetchEvents(); }, []);

  function formatTime(iso: string) {
    if (iso.length === 10) return '全天';
    return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">今日行事曆</h3>
        <button onClick={fetchEvents} className="text-xs text-gray-400 hover:text-gray-600">↻</button>
      </div>

      {!connected && (
        <div className="text-xs text-gray-400">
          <a href="/api/google/auth" className="text-blue-500 hover:underline">連接 Google Calendar</a>
        </div>
      )}

      {connected && loading && <p className="text-xs text-gray-400">載入中...</p>}

      {connected && !loading && events.length === 0 && (
        <p className="text-xs text-gray-400">今天沒有行程{cached ? '（快取）' : ''}</p>
      )}

      {connected && !loading && events.map(e => (
        <div key={e.id} className="flex gap-2 py-1 border-b border-gray-50 last:border-0">
          <span className="text-xs text-gray-500 flex-shrink-0 w-10">{formatTime(e.start_time)}</span>
          <span className="text-xs text-gray-700 truncate">{e.title}</span>
        </div>
      ))}

      {cached && events.length > 0 && (
        <p className="text-xs text-gray-300 mt-1">快取資料</p>
      )}
    </div>
  );
}
