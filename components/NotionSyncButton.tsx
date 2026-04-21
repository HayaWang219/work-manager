'use client';
import { useState, useEffect } from 'react';

interface Props {
  onSynced?: () => void;
}

export default function NotionSyncButton({ onSynced }: Props) {
  const [status, setStatus] = useState<{ connected: boolean; lastSync: string | null }>({ connected: false, lastSync: null });
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/notion/sync').then(r => r.json()).then(setStatus);
  }, []);

  async function sync() {
    setSyncing(true);
    setResult(null);
    const res = await fetch('/api/notion/sync', { method: 'POST' });
    const data = await res.json();
    setSyncing(false);
    if (data.error) {
      setResult(`錯誤：${data.error}`);
    } else {
      setResult(`↑${data.pushed} ↓${data.pulled}`);
      fetch('/api/notion/sync').then(r => r.json()).then(setStatus);
      onSynced?.();
    }
  }

  function formatTime(ts: string | null) {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  }

  if (!status.connected) {
    return (
      <a href="/setup" className="text-xs text-gray-400 hover:text-gray-600">
        設定 Notion →
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={sync}
        disabled={syncing}
        className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 flex items-center gap-1"
      >
        <span className={syncing ? 'animate-spin' : ''}>⟳</span>
        Notion 同步
      </button>
      {result && <span className="text-xs text-green-600">{result}</span>}
      {!result && status.lastSync && (
        <span className="text-xs text-gray-400">{formatTime(status.lastSync)}</span>
      )}
    </div>
  );
}
