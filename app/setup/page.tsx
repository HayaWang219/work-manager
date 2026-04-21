'use client';
import { useState, useEffect } from 'react';

interface SetupStatus {
  googleClientId: string;
  googleConnected: boolean;
  notionToken: string;
  notionDatabaseId: string;
  notionConnected: boolean;
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [notionToken, setNotionToken] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then((data: SetupStatus) => {
      setStatus(data);
      setGoogleClientId(data.googleClientId);
      setNotionDatabaseId(data.notionDatabaseId);
    });
  }, []);

  async function saveGoogle() {
    setSaving(true);
    await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ google_client_id: googleClientId, google_client_secret: googleClientSecret }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    const data = await fetch('/api/setup').then(r => r.json());
    setStatus(data);
  }

  async function saveNotion() {
    setSaving(true);
    await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notion_token: notionToken, notion_database_id: notionDatabaseId }),
    });
    setSaving(false);
  }

  async function testNotion() {
    setTestResult(null);
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notion_token: notionToken,
        notion_database_id: notionDatabaseId,
        test_notion: true,
      }),
    });
    const data = await res.json();
    setTestResult(data.ok ? '連線成功 ✓' : `失敗：${data.error}`);
    if (data.ok) {
      const s = await fetch('/api/setup').then(r => r.json());
      setStatus(s);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← 回首頁</a>
        <h1 className="font-semibold text-gray-800">設定</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Google Calendar */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Google Calendar</h2>
            {status?.googleConnected ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">已連接</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">未連接</span>
            )}
          </div>

          <div className="text-xs text-gray-500 mb-4 space-y-1 bg-gray-50 rounded p-3">
            <p className="font-medium text-gray-600">設定步驟：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>前往 <span className="font-mono">console.cloud.google.com</span> 建立或選擇專案</li>
              <li>啟用「Google Calendar API」</li>
              <li>建立 OAuth 2.0 憑證（Web 應用程式）</li>
              <li>在「已授權的重新導向 URI」加入：<span className="font-mono bg-white px-1 rounded">http://localhost:3000/api/google/callback</span></li>
              <li>複製 Client ID 和 Client Secret 貼到下方</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Client ID</label>
              <input
                type="text"
                value={googleClientId}
                onChange={e => setGoogleClientId(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Client Secret</label>
              <input
                type="password"
                value={googleClientSecret}
                onChange={e => setGoogleClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveGoogle}
                disabled={saving}
                className="text-sm bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {saved ? '已儲存 ✓' : '儲存憑證'}
              </button>
              {googleClientId && (
                <a
                  href="/api/google/auth"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  連接 Google →
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Notion */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Notion 同步</h2>
            {status?.notionConnected ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">已連接</span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">未連接</span>
            )}
          </div>

          <div className="text-xs text-gray-500 mb-4 space-y-1 bg-gray-50 rounded p-3">
            <p className="font-medium text-gray-600">設定步驟：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>前往 <span className="font-mono">notion.so/my-integrations</span> 建立 Internal Integration</li>
              <li>複製 Integration Token（以 secret_ 開頭）</li>
              <li>在 Notion 建立資料庫，需要以下欄位：
                <span className="font-mono bg-white px-1 rounded ml-1">Name(title), Status(select), Category(select), ReportFlag(checkbox), IsToday(checkbox), LocalId(number)</span>
              </li>
              <li>將資料庫分享給你的 Integration（右上角 ••• → Connections）</li>
              <li>從資料庫 URL 複製 Database ID（32 碼字串）</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Integration Token</label>
              <input
                type="password"
                value={notionToken}
                onChange={e => setNotionToken(e.target.value)}
                placeholder="secret_..."
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Database ID</label>
              <input
                type="text"
                value={notionDatabaseId}
                onChange={e => setNotionDatabaseId(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 font-mono"
              />
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={saveNotion}
                disabled={saving}
                className="text-sm bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                儲存
              </button>
              <button
                onClick={testNotion}
                className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
              >
                測試連線
              </button>
              {testResult && (
                <span className={`text-xs ${testResult.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult}
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="text-center">
          <a href="/" className="text-sm text-blue-600 hover:text-blue-800">
            ← 回到工作管理
          </a>
        </div>
      </div>
    </div>
  );
}
