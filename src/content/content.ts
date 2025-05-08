import { Credentials } from '../types';

/**
 * ユーザー名フィールドを識別して取得する
 */
function getUsernameField(): HTMLInputElement | null {
    return document.querySelector([
        "input[type='text']",
        "input[type='email']",
        "input[name*='user' i]",
        "input[name*='email' i]",
        "input[name*='login' i]",
        "input[id*='user' i]",
        "input[id*='email' i]",
        "input[id*='login' i]",
        "input[class*='user' i]",
        "input[class*='login' i]",
        "input[placeholder*='user' i]",
        "input[placeholder*='email' i]",
        "input[aria-label*='user' i]",
        "input[aria-label*='email' i]",
        "input[name='username']",
        "input[placeholder='Username']"
    ].join(", ")) as HTMLInputElement | null;
}

/**
 * パスワードフィールドを識別して取得する
 */
function getPasswordField(): HTMLInputElement | null {
    return document.querySelector([
        "input[type='password']",
        "input[name*='pass' i]",
        "input[id*='pass' i]",
        "input[class*='pass' i]",
        "input[placeholder*='pass' i]",
        "input[aria-label*='pass' i]",
        "input[name='password']",
        "input[placeholder='Password']"
    ].join(", ")) as HTMLInputElement | null;
}

/**
 * 現在のページに保存済みの認証情報を自動入力する
 */
function tryAutofillCredentials(credentials: Credentials) {
    const currentUrl = window.location.origin;
    console.log("[Autofill] Current URL:", currentUrl);

    const usernameField = getUsernameField();
    const passwordField = getPasswordField();

    if (!usernameField && !passwordField) {
        console.log("[Autofill] ログインフォームが見つかりません");
        return;
    }

    if (credentials[currentUrl]) {
        const { username, password } = credentials[currentUrl];
        if (usernameField && username) {
            usernameField.value = username;
            // 変更イベントを発火してフォームの検証を更新
            dispatchInputEvent(usernameField);
        }
        if (passwordField && password) {
            passwordField.value = password;
            // 変更イベントを発火してフォームの検証を更新
            dispatchInputEvent(passwordField);
        }
        console.log("[Autofill] 認証情報を自動入力しました");
    } else {
        console.log("[Autofill] このサイト用の認証情報が見つかりません");
    }
}

/**
 * 入力フィールドに変更イベントを発火させる
 */
function dispatchInputEvent(field: HTMLInputElement) {
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * フォームの送信を監視し、認証情報を保存する
 */
function setupFormSubmissionListeners(currentUrl: string) {
    // ページ内の全てのフォームを取得
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
        console.log("[Autofill] フォームが見つかりません");
        return;
    }

    console.log(`[Autofill] ${forms.length}個のフォームを監視します`);
    
    forms.forEach((form, index) => {
        form.addEventListener("submit", () => {
            // フォーム送信時にフィールド値を取得
            const usernameField = form.querySelector(
                "input[type='text'], input[type='email'], input[id*='user' i], input[name*='user' i], input[id*='email' i], input[name*='email' i]"
            ) as HTMLInputElement | null;
            
            const passwordField = form.querySelector(
                "input[type='password']"
            ) as HTMLInputElement | null;
            
            if (usernameField && passwordField) {
                const username = usernameField.value.trim();
                const password = passwordField.value.trim();
                
                if (username && password) {
                    saveCredentials(currentUrl, username, password);
                }
            }
        });
    });
}

/**
 * 認証情報をストレージに保存する
 */
function saveCredentials(url: string, username: string, password: string) {
    chrome.storage.local.get({ credentials: {} }, (result) => {
        const credentials = result.credentials as Credentials;
        
        // 既存の認証情報を更新または新規追加
        credentials[url] = { username, password };
        
        chrome.storage.local.set({ credentials }, () => {
            console.log(`[Autofill] サイト ${url} の認証情報を保存しました`);
        });
    });
}

/**
 * DOM変更を監視し、動的に追加されたフォームにリスナーを設定
 */
function setupDynamicFormMonitoring(currentUrl: string) {
    const observer = new MutationObserver((mutations) => {
        let formAdded = false;
        
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        // 追加されたノードがフォームか、フォームを含むかチェック
                        const forms = node.tagName === 'FORM' ? [node] : node.querySelectorAll('form');
                        if (forms.length > 0) {
                            formAdded = true;
                        }
                    }
                });
            }
        });
        
        if (formAdded) {
            console.log("[Autofill] 動的に追加されたフォームを検出しました");
            setupFormSubmissionListeners(currentUrl);
        }
    });
    
    // ドキュメントの監視を開始
    observer.observe(document.body, { childList: true, subtree: true });
}

// 初期化処理
function initialize() {
    const currentUrl = window.location.origin;
    
    chrome.storage.local.get("credentials", (result) => {
        const credentials = (result.credentials || {}) as Credentials;
        
        // 認証情報の自動入力
        tryAutofillCredentials(credentials);
        
        // フォーム送信の監視設定
        setupFormSubmissionListeners(currentUrl);
        
        // 動的に追加されるフォームの監視
        setupDynamicFormMonitoring(currentUrl);
    });
}

// コンテンツスクリプト実行開始
console.log("[Autofill] コンテンツスクリプトを読み込みました");
initialize();