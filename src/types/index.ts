// 共通型定義

export interface CredentialEntry {
  username: string;
  password: string;
}

export interface Credentials {
  [url: string]: CredentialEntry;
}

export interface InputCache {
  url: string;
  username: string;
  password: string;
}

// ストレージ関連の型定義
export interface StorageData {
  credentials?: Credentials;
  inputCache?: InputCache;
}