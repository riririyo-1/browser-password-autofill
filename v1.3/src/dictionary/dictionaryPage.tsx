import React, { useState, useEffect } from 'react';
import EditableTable from './EditableTable';
import '../popup/style.css';
import { Credentials } from '../types';

const DictionaryPage: React.FC = () => {
  const [credentials, setCredentials] = useState<Credentials>({});
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: ''
  });

  useEffect(() => {
    chrome.storage.local.get('credentials', ({ credentials = {} }) => {
      setCredentials(credentials);
    });
  }, []);

  const handleUpdate = (entry: { url: string; username: string; password: string }) => {
    const updated = { ...credentials };
    // If URL changed key, remove old
    const oldUrl = Object.keys(credentials).find(u => u === entry.url) ? entry.url : null;
    if (oldUrl && oldUrl !== entry.url) {
      delete updated[oldUrl];
    }
    updated[entry.url] = { username: entry.username, password: entry.password };

    chrome.storage.local.set({ credentials: updated }, () => {
      setCredentials(updated);
      setStatusMessage({ text: '更新しました', type: 'success' });
      setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
    });
  };

  const handleDelete = (url: string) => {
    if (!confirm('本当に削除しますか？')) {
      return;
    }
    const updated = { ...credentials };
    delete updated[url];
    chrome.storage.local.set({ credentials: updated }, () => {
      setCredentials(updated);
      setStatusMessage({ text: '削除しました', type: 'success' });
      setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
    });
  };

  // Flatten credentials to list with URL
  const data = Object.entries(credentials).map(([url, cred]) => ({
    url,
    username: cred.username,
    password: cred.password
  }));

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-0">
          登録済みログイン情報
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(credentials, null, 2)], { type: 'application/json' });
              const urlObj = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = urlObj;
              a.download = 'password_credentials.json';
              a.click();
              URL.revokeObjectURL(urlObj);
              setStatusMessage({ text: 'エクスポート完了', type: 'success' });
              setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            aria-label="登録情報をJSONファイルとしてエクスポート"
          >
            エクスポート
          </button>
          <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center justify-center cursor-pointer">
            インポート
            <input
              type="file"
              className="hidden"
              accept="application/json"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  try {
                    const imported = JSON.parse(ev.target?.result as string);
                    const merged = { ...credentials, ...imported };
                    chrome.storage.local.set({ credentials: merged }, () => {
                      setCredentials(merged);
                      setStatusMessage({ text: 'インポート完了', type: 'success' });
                      setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
                      e.target.value = '';
                    });
                  } catch {
                    setStatusMessage({ text: 'インポートに失敗しました', type: 'error' });
                    setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
                  }
                };
                reader.readAsText(file);
              }}
              aria-label="JSONファイルからデータをインポート"
            />
          </label>
        </div>
      </div>

      {statusMessage.text && (
        <div
          className={`mb-4 p-2 rounded ${
            statusMessage.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <EditableTable data={data} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  );
};

export default DictionaryPage;