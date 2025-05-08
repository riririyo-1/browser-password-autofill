import React, { useState, useEffect, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, ColumnDef, createColumnHelper, flexRender } from '@tanstack/react-table';
import '../popup/style.css';

interface CredentialEntry {
  username: string;
  password: string;
}

interface Credentials {
  [url: string]: CredentialEntry;
}

interface RowData {
  url: string;
  username: string;
  password: string;
}

// DictionaryPageコンポーネントをexport defaultに変更
const DictionaryPage = () => {
  const [credentials, setCredentials] = useState<Credentials>({});
  const [filter, setFilter] = useState('');
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ url: string, username: string, password: string }>({
    url: '', username: '', password: ''
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCredentials();
  }, []);

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
              >
                保存
              </button>
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                onClick={cancelEdit}
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
            >
              編集
            </button>
            <button 
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              onClick={() => handleDelete(url)}
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
      alert("更新しました");
    });
  };

  const handleDelete = (url: string) => {
    if (confirm('本当に削除しますか？')) {
      const updatedCreds = { ...credentials };
      delete updatedCreds[url];
      
      chrome.storage.local.set({ credentials: updatedCreds }, () => {
        setCredentials(updatedCreds);
        alert("削除しました");
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
          alert("インポート完了");
          event.target.value = ''; // ファイル選択をリセット
        });
      } catch (error) {
        alert("インポートに失敗しました。ファイル形式を確認してください。");
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
            className="btn-secondary text-sm"
          >
            エクスポート
          </button>
          
          <label className="btn-secondary text-sm flex items-center justify-center cursor-pointer">
            インポート
            <input
              type="file"
              className="hidden"
              accept="application/json"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          className="input w-full max-w-md"
          placeholder="URL またはユーザー名で検索..."
          value={filter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
        />
      </div>
      
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    scope="col"
                    className="px-4 py-3 font-medium uppercase tracking-wide"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id}
                    className="px-4 py-2"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// default exportを追加
export default DictionaryPage;