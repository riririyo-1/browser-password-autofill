# v1.4 ブラウザパスワードオートフィル 拡張機能 設計

## 1. 技術スタック

- React + Vite (TypeScript)
- Tailwind CSS + shadcn/ui
- Dark モード: Tailwind CSS の dark モード + 自作 React Context
- i18n: react-intl + JSON メッセージファイル
- Vite プラグイン: vite-plugin-crx（Chrome 拡張ビルド用）
- ストレージ: chrome.storage.local

## 2. ディレクトリ構成

```mermaid
graph LR
  subgraph v1.4
    manifest.json
    background.ts
    content.ts
    assets[/assets/*]
    src[/src]
  end
  subgraph src
    popup[popup/]
    dict[dictionary/]
    common[common/]
    theme[theme/]
    i18n[i18n/]
  end
  popup --> PopupTsx[Popup.tsx]
  dict --> DictPageTsx[dictionaryPage.tsx]
  common --> UIComp[ui-components.tsx]
  theme --> ThemeProv[ThemeProvider.tsx]
  i18n --> MsgFiles[ja.json, en.json]
```

## 3. コンポーネント責務

- **popup/Popup.tsx**  
  - shadcn/ui を用いたモダン UI  
  - react-intl の `useIntl()` で文字列取得  
  - URL・ユーザ名・パスワード入力フォーム  
  - chrome.storage.local への保存  
  - 辞書ページ遷移ボタン

- **dictionary/dictionaryPage.tsx**  
  - storage からのレコード取得・検索・フィルタ  
  - 一覧表示（選択・削除・CSVエクスポート）  
  - i18n 対応

- **common/ui-components.tsx**  
  - shadcn/ui ベースの汎用コンポーネント（Button, Input, Modal など）

- **theme/ThemeProvider.tsx**  
  - React Context（ThemeContext）でテーマ状態管理  
  - Tailwind CSS の dark クラス切り替え  
  - トグル UI コンポーネント

- **i18n/messages/**  
  - ja.json, en.json などのメッセージファイル  
  - `<IntlProvider locale={locale} messages={messages}>` をアプリルートで設定

## 4. 開発手順

1. v1.4 フォルダに移動して Vite React プロジェクト初期化  
2. Tailwind CSS + dark モードセットアップ  
3. shadcn/ui, react-intl, vite-plugin-crx をインストール  
4. `manifest.json` を v1.3 からマージ  
5. `vite.config.ts` に CRX ビルドプラグイン設定  
6. `ThemeProvider.tsx` 実装、dark モードトグル追加  
7. i18n/messages ファイル作成、IntlProvider 設定  
8. Popup と Dictionary ページ実装  
9. Chrome 拡張として動作確認

## 5. ダークモード & i18n 実装例

```tsx
// ThemeProvider.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<'light'|'dark'>('light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(prev => prev === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// App.tsx
import { IntlProvider } from 'react-intl';
import ja from './i18n/messages/ja.json';
import en from './i18n/messages/en.json';

const messages = { ja, en };
const locale = navigator.language.startsWith('ja') ? 'ja' : 'en';

<IntlProvider locale={locale} messages={messages[locale]}>
  <ThemeProvider>
    <Popup />
    <DictionaryPage />
  </ThemeProvider>
</IntlProvider>
