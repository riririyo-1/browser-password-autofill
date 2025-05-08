import React, { useState, useEffect, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef, createColumnHelper, flexRender, SortingState } from '@tanstack/react-table';
import '../popup/style.css';
import { Credentials, CredentialEntry } from '../types';

interface RowData {
  url: string;
  username: string;
  password: string;
}

// DictionaryPageコンポーネント
const DictionaryPage = () => {
  const [credentials, setCredentials] = useState<Credentials>({});
  const [filter, setFilter] = useState('');
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ url: string, username: string, password: string }>({
    url: '', username: '', password: ''
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: 'url', desc: false }]);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ 
    text: '', 
    type: '' 
  });

  useEffect(() => {
    loadCredentials();
  }, []);
  
  // 一定時間後にステータスメッセージをクリアする
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const loadCredentials = () => {
    chrome.storage.local.get('credentials', ({ credentials = {} }) => {
      setCredentials(credentials);
    });
  };

  const data = useMemo(() => {
    return Object.entries(credentials)
      .filter(([url, { username }]) => {
        if (!filter) return true;
        const lcFilter = filter.toLowerCase();
        return url.toLowerCase().includes(lcFilter) || 
               username.toLowerCase().includes(lcFilter);
      })
      .map(([url, { username, password }]) => ({
        url,
        username,
        password
      }));
  }, [credentials, filter]);

  const columnHelper = createColumnHelper<RowData>();
  const columns = useMemo<ColumnDef<RowData>[]>(() => [
    columnHelper.accessor('url', {
      header: 'URL',
      cell: info => {
        const url = info.getValue();
        if (editingUrl === url) {
          return (
            <input
              className="input w-full"
              value={editForm.url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, url: e.target.value})}
              aria-label="URL編集"
            />
          );
        }
        return url;
      },
    }),
    columnHelper.accessor('username', {
      header: 'ユーザー名',
      cell: info => {
        const url = info.row.original.url;
        if (editingUrl === url) {
          return (
            <input
              className="input w-full"
              value={editForm.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, username: e.target.value})}
              aria-label="ユーザー名編集"
            />
          );
        }
        return info.getValue();
      },
    }),
    columnHelper.accessor('password', {
      header: 'パスワード',
      cell: info => {
        const url = info.row.original.url;
        const password = info.getValue();
        
        if (editingUrl === url) {
          return (
            <input
              className="input w-full"
              type={visiblePasswords[url] ? 'text' : 'password'}
              value={editForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, password: e.target.value})}
              aria-label="パスワード編集"
            />
          );
        }
        
        return visiblePasswords[url] ? password : '••••••••';
      },
    }),
    columnHelper.display({
      id: 'visibility',
      header: '表示',
      cell: info => {
        const url = info.row.original.url;
        return (
          <div className="flex justify-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600"
              checked={!!visiblePasswords[url]}
              onChange={() => togglePasswordVisibility(url)}
              aria-label={`${visiblePasswords[url] ? 'パスワードを隠す' : 'パスワードを表示'}`}
            />
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: info => {
        const url = info.row.original.url;
        
        if (editingUrl === url) {
          return (
            <div className="flex space-x-2">
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => handleUpdate()}
                aria-label="変更を保存"
              >
                保存
              </button>
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                onClick={cancelEdit}
                aria-label="編集をキャンセル"
              >
                キャンセル
              </button>
            </div>
          );
        }
        
        return (
          <div className="flex space-x-2">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              onClick={() => startEdit(url)}
              aria-label="このエントリを編集"
            >
              編集
            </button>
            <button 
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              onClick={() => handleDelete(url)}
              aria-label="このエントリを削除"
            >
              削除
            </button>
          </div>
        );
      },
    }),
  ], [editingUrl, editForm, visiblePasswords]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const togglePasswordVisibility = (url: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  const startEdit = (url: string) => {
    const { username, password } = credentials[url];
    setEditingUrl(url);
    setEditForm({ url, username, password });
  };

  const cancelEdit = () => {
    setEditingUrl(null);
  };

  const handleUpdate = () => {
    if (!editingUrl) return;
    
    // 入力検証
    if (!editForm.url.trim() || !editForm.username.trim() || !editForm.password.trim()) {
      setStatusMessage({ text: '全ての項目を入力してください', type: 'error' });
      return;
    }
    
    try {
      // URLの検証 (必要に応じて)
      new URL(editForm.url);
      
      const updatedCreds = { ...credentials };
      if (editingUrl !== editForm.url) {
        delete updatedCreds[editingUrl];
      }
      
      updatedCreds[editForm.url] = {
        username: editForm.username,
        password: editForm.password
      };
      
      chrome.storage.local.set({ credentials: updatedCreds }, () => {
        setCredentials(updatedCreds);
        setEditingUrl(null);
        setStatusMessage({ text: "更新しました", type: 'success' });
      });
    } catch (error) {
      setStatusMessage({ text: "有効なURLを入力してください", type: 'error' });
    }
  };

  const handleDelete = (url: string) => {
    if (confirm('本当に削除しますか？')) {
      const updatedCreds = { ...credentials };
      delete updatedCreds[url];
      
      chrome.storage.local.set({ credentials: updatedCreds }, () => {
        setCredentials(updatedCreds);
        setStatusMessage({ text: "削除しました", type: 'success' });
      });
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(credentials, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password_credentials.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ text: "エクスポート完了", type: 'success' });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        const merged = { ...credentials, ...importedData };
        
        chrome.storage.local.set({ credentials: merged }, () => {
          setCredentials(merged);
          setStatusMessage({ text: "インポート完了", type: 'success' });
          event.target.value = ''; // ファイル選択をリセット
        });
      } catch (error) {
        setStatusMessage({ text: "インポートに失敗しました。ファイル形式を確認してください。", type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-0">
          登録済みログイン情報
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={handleExport}
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
              onChange={handleImport}
              aria-label="JSONファイルからデータをインポート"
            />
          </label>
        </div>
      </div>
      
      {statusMessage.text && (
        <div className={`mb-4 p-2 rounded ${
          statusMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
          statusMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' : ''
        }`}>
          {statusMessage.text}
        </div>
      )}
      
      <div className="mb-4">
        <input
          type="text"
          className="input w-full max-w-md"
          placeholder="URL またはユーザー名で検索..."
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
          aria-label="検索"
        />
      </div>
      
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const isSortable = header.column.getCanSort();
                  return (
                    <th 
                      key={header.id}
                      scope="col"
                      className={`px-4 py-3 font-medium uppercase tracking-wide ${isSortable ? 'cursor-pointer select-none' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center justify-between">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable && (
                          <span className="ml-1">
                            {{
                              asc: '🔼',
                              desc: '🔽',
                            }[header.column.getIsSorted() as string] ?? ''}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id}
                      className="px-4 py-2"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                  {filter ? '検索に一致するデータがありません' : 'ログイン情報がありません'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DictionaryPage;