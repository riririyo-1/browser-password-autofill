// background.ts
console.log('Background script loaded');

// エラーハンドリングを追加
chrome.runtime.onError.addListener((error) => {
  console.error('Extension error:', error.message);
});

// 将来的な機能のための基本的なリスナー設定
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // 初期設定確認
  chrome.storage.local.get(['credentials'], (result) => {
    if (!result.credentials) {
      console.log('Initializing empty credentials storage');
      chrome.storage.local.set({ credentials: {} });
    }
  });
});

// メッセージリスナーの設定例
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  if (request.action === 'fetchCredentials') {
    chrome.storage.local.get(['credentials'], (result) => {
      sendResponse({ success: true, data: result.credentials || {} });
    });
    return true; // 非同期レスポンスを使用する場合はtrueを返す
  }
  
  // 今後メッセージ処理が必要な場合はここに追加
  
  return true; // 非同期レスポンスを使用する場合はtrueを返す
});