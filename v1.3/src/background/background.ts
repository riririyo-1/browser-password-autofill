// background.ts
console.log('Background script loaded');

// 将来的な機能のための基本的なリスナー設定
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// メッセージリスナーの設定例
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  
  // 今後メッセージ処理が必要な場合はここに追加
  
  return true; // 非同期レスポンスを使用する場合はtrueを返す
});