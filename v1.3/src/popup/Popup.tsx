import React, { useState, useEffect } from 'react';
import './style.css'; // Assuming your styles are in style.css

const Popup = () => {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');

    // Restore input cache on component mount
    useEffect(() => {
        chrome.storage.local.get(['inputCache'], ({ inputCache }) => {
            if (inputCache) {
                setUrl(inputCache.url || '');
                setUsername(inputCache.username || '');
                setPassword(inputCache.password || '');
            }
        });
    }, []);

    // Cache inputs on change
    useEffect(() => {
        const inputCache = { url, username, password };
        chrome.storage.local.set({ inputCache });
    }, [url, username, password]);

    const handleSave = () => {
        setStatus('');
        let processedUrl;
        try {
            processedUrl = new URL(url.trim()).origin;
        } catch (e) {
            setStatus('URLが不正です');
            return;
        }

        if (!username || !password) {
            setStatus('ユーザー名とパスワードを入力してください');
            return;
        }

        chrome.storage.local.get({ credentials: {} }, (data) => {
            const credentials = data.credentials;
            credentials[processedUrl] = { username, password };
            chrome.storage.local.set({ credentials }, () => {
                setStatus('保存しました');
                // Clear inputs after saving
                // setUrl('');
                // setUsername('');
                // setPassword('');
            });
        });
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
                />
            </div>
            <button id="save" className="button mb-2" onClick={handleSave}>
                保存
            </button>
            <button id="open-dictionary" className="button button-secondary" onClick={openDictionary}>
                ユーザー辞書を開く
            </button>
            {status && <div id="status" className="footer">
                {status}
            </div>}
        </div>
    );
};

export default Popup;