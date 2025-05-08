document.getElementById("save").addEventListener("click", () => {
    const rawUrl = document.getElementById("url").value.trim();
    const status = document.getElementById("status");
    status.textContent = "";

    let url;
    try {
        url = new URL(rawUrl).origin;
    } catch (e) {
        status.textContent = "URLが不正です";
        return;
    }

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        status.textContent = "ユーザー名とパスワードを入力してください";
        return;
    }

    chrome.storage.local.get({ credentials: {} }, (data) => {
        const credentials = data.credentials;
        credentials[url] = { username, password };
        chrome.storage.local.set({ credentials }, () => {
            status.textContent = "保存しました";
        });
    });
});

document.getElementById("open-dictionary").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dictionary.html") });
});

document.addEventListener("DOMContentLoaded", restoreInputCache);
document.addEventListener("input", cacheInputs);

function cacheInputs() {
    const inputCache = {
        url: document.getElementById("url")?.value || "",
        username: document.getElementById("username")?.value || "",
        password: document.getElementById("password")?.value || ""
    };
    chrome.storage.local.set({ inputCache });
}

function restoreInputCache() {
    chrome.storage.local.get({ inputCache: {} }, ({ inputCache }) => {
        if (inputCache.url) document.getElementById("url").value = inputCache.url;
        if (inputCache.username) document.getElementById("username").value = inputCache.username;
        if (inputCache.password) document.getElementById("password").value = inputCache.password;
    });
}
