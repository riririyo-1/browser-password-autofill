import React, { useState, useEffect } from 'react';
import './style.css';
import { Credentials, InputCache } from '../types';

const Popup = () => {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' | '' }>({
        message: '',
        type: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Restore input cache on component mount
    useEffect(() => {
        chrome.storage.local.get(['inputCache'], (result) => {
            const inputCache = result.inputCache as InputCache | undefined;
            if (inputCache) {
                setUrl(inputCache.url || '');
                setUsername(inputCache.username || '');
                setPassword(inputCache.password || '');
            }
        });
    }, []);

    // Cache inputs on change
    useEffect(() => {
        const inputCache: InputCache = { url, username, password };
        chrome.storage.local.set({ inputCache });
    }, [url, username, password]);

    // 一定時間後にステータスメッセージをクリアする
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => {
                setStatus({ message: '', type: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleSave = async () => {
        setStatus({ message: '', type: '' });
        setIsSaving(true);
        
        // バリデーション
        if (!username || !password) {
            setStatus({ message: 'ユーザー名とパスワードを入力してください', type: 'error' });
            setIsSaving(false);
            return;
        }

        let processedUrl;
        try {
            // URLの検証と正規化
            processedUrl = new URL(url.trim()).origin;
        } catch (e) {
            setStatus({ message: 'URLが不正です', type: 'error' });
            setIsSaving(false);
            return;
        }

        try {
            // 非同期処理をPromiseでラップ
            await new Promise<void>((resolve, reject) => {
                chrome.storage.local.get({ credentials: {} }, (data) => {
                    try {
                        const credentials = data.credentials as Credentials;
                        credentials[processedUrl] = { username, password };
                        chrome.storage.local.set({ credentials }, () => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve();
                            }
                        });
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            setStatus({ message: '保存しました', type: 'success' });
            // 保存成功後にフィールドをクリアしない（v1.2からの仕様を踏襲）
            // setUrl('');
            // setUsername('');
            // setPassword('');
        } catch (error) {
            console.error('保存エラー:', error);
            setStatus({ message: '保存に失敗しました', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const openDictionary = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dictionary.html') });
    };

    return (
        <div className="popup-container">
            <h3 className="header">登録</h3>
            <div className="input-group">
                <label htmlFor="url" className="label">URL</label>
                <input
                    id="url"
                    className="input"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    aria-label="URL"
                />
            </div>
            <div className="input-group">
                <label htmlFor="username" className="label">ユーザー名</label>
                <input
                    id="username"
                    className="input"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-label="ユーザー名"
                />
            </div>
            <div className="input-group">
                <label htmlFor="password" className="label">パスワード</label>
                <input
                    id="password"
                    type="password"
                    className="input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="パスワード"
                />
            </div>
            <button 
                id="save" 
                className="button mb-2" 
                onClick={handleSave}
                disabled={isSaving}
                aria-label="保存ボタン"
            >
                {isSaving ? '保存中...' : '保存'}
            </button>
            <button 
                id="open-dictionary" 
                className="button button-secondary" 
                onClick={openDictionary}
                aria-label="辞書を開くボタン"
            >
                ユーザー辞書を開く
            </button>
            {status.message && (
                <div 
                    id="status" 
                    className={`footer mt-2 ${status.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                    role="status"
                    aria-live="polite"
                >
                    {status.message}
                </div>
            )}
        </div>
    );
};

export default Popup;