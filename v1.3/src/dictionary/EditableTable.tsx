import React, { useState, useEffect } from 'react';
import { CredentialEntry } from '../types';

interface Entry extends CredentialEntry {
  url: string;
}

interface EditableTableProps {
  data: Entry[];
  onUpdate: (entry: Entry) => void;
  onDelete: (url: string) => void;
}

const EditableTable: React.FC<EditableTableProps> = ({ data, onUpdate, onDelete }) => {
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'url' | 'username'>('url');
  const [sortDesc, setSortDesc] = useState(false);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Entry>({ url: '', username: '', password: '' });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const togglePasswordVisibility = (url: string) => {
    setVisiblePasswords(prev => ({ ...prev, [url]: !prev[url] }));
  };

  useEffect(() => {
    if (editingUrl) {
      const entry = data.find(d => d.url === editingUrl);
      if (entry) {
        setEditForm({ ...entry });
      }
    }
  }, [editingUrl, data]);

  const handleSort = (key: 'url' | 'username') => {
    if (sortKey === key) {
      setSortDesc(prev => !prev);
    } else {
      setSortKey(key);
      setSortDesc(false);
    }
  };

  const filtered = data.filter(d =>
    d.url.toLowerCase().includes(filterText.toLowerCase()) ||
    d.username.toLowerCase().includes(filterText.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aKey = sortKey === 'url' ? a.url : a.username;
    const bKey = sortKey === 'url' ? b.url : b.username;
    if (aKey < bKey) return sortDesc ? 1 : -1;
    if (aKey > bKey) return sortDesc ? -1 : 1;
    return 0;
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          className="input w-full max-w-md"
          placeholder="URL またはユーザー名で検索..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          aria-label="検索"
        />
      </div>
      <table className="w-full text-sm text-left overflow-x-auto">
        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('url')}>
              URL {sortKey === 'url' ? (sortDesc ? '🔽' : '🔼') : ''}
            </th>
            <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('username')}>
              ユーザー名 {sortKey === 'username' ? (sortDesc ? '🔽' : '🔼') : ''}
            </th>
            <th className="px-4 py-3">パスワード</th>
            <th className="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sorted.length > 0 ? (
            sorted.map(row => (
              <tr key={row.url} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2">
                  {editingUrl === row.url ? (
                    <input
                      type="text"
                      className="input w-full"
                      value={editForm.url}
                      onChange={e => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                      aria-label="URL編集"
                    />
                  ) : (
                    row.url
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingUrl === row.url ? (
                    <input
                      type="text"
                      className="input w-full"
                      value={editForm.username}
                      onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      aria-label="ユーザー名編集"
                    />
                  ) : (
                    row.username
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingUrl === row.url ? (
                    <input
                      type="text"
                      className="input w-full"
                      value={editForm.password}
                      onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      aria-label="パスワード編集"
                    />
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="flex-1">{visiblePasswords[row.url] ? row.password : '••••••••'}</span>
                      <button
                        onClick={() => togglePasswordVisibility(row.url)}
                        className="text-blue-600 hover:underline text-sm ml-2"
                        aria-label={`${visiblePasswords[row.url] ? 'パスワードを隠す' : 'パスワードを表示'}`}
                      >
                        {visiblePasswords[row.url] ? '隠す' : '表示'}
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 space-x-2">
                  {editingUrl === row.url ? (
                    <>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => {
                          onUpdate(editForm);
                          setEditingUrl(null);
                        }}
                        aria-label="変更を保存"
                      >
                        保存
                      </button>
                      <button
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => setEditingUrl(null)}
                        aria-label="編集をキャンセル"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => setEditingUrl(row.url)}
                        aria-label="このエントリを編集"
                      >
                        編集
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => onDelete(row.url)}
                        aria-label="このエントリを削除"
                      >
                        削除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                {filterText ? '検索に一致するデータがありません' : 'ログイン情報がありません'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EditableTable;