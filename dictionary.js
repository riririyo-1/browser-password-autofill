function renderTable(credentials, filter = "") {
    const tableBody = document.getElementById("dict-table");
    tableBody.innerHTML = "";

    const filteredEntries = Object.entries(credentials).filter(([url, { username }]) => {
        const keyword = filter.toLowerCase();
        return url.toLowerCase().includes(keyword) || username.toLowerCase().includes(keyword);
    });

    filteredEntries.forEach(([url, { username, password }]) => {
        const row = document.createElement("tr");

        // URL
        const urlCell = document.createElement("td");
        const urlInput = document.createElement("input");
        urlInput.type = "text";
        urlInput.value = url;
        urlCell.appendChild(urlInput);
        row.appendChild(urlCell);

        // Username
        const userCell = document.createElement("td");
        const userInput = document.createElement("input");
        userInput.type = "text";
        userInput.value = username;
        userCell.appendChild(userInput);
        row.appendChild(userCell);

        // Password
        const passCell = document.createElement("td");
        const passInput = document.createElement("input");
        passInput.type = "password";
        passInput.value = password;
        passCell.appendChild(passInput);
        row.appendChild(passCell);

        // Show/Hide checkbox
        const toggleCell = document.createElement("td");
        const toggleCheckbox = document.createElement("input");
        toggleCheckbox.type = "checkbox";
        toggleCheckbox.addEventListener("change", () => {
            passInput.type = toggleCheckbox.checked ? "text" : "password";
        });
        toggleCell.appendChild(toggleCheckbox);
        row.appendChild(toggleCell);

        // 操作列（更新・削除）
        const actionsCell = document.createElement("td");
        const updateBtn = document.createElement("button");
        updateBtn.textContent = "更新";
        updateBtn.addEventListener("click", () => {
            const newUrl = urlInput.value;
            const newUsername = userInput.value;
            const newPassword = passInput.value;

            chrome.storage.local.get("credentials", ({ credentials = {} }) => {
                delete credentials[url];
                credentials[newUrl] = { username: newUsername, password: newPassword };
                chrome.storage.local.set({ credentials }, () => {
                    alert("更新しました");
                    renderTable(credentials, document.getElementById("search").value);
                });
            });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "削除";
        deleteBtn.addEventListener("click", () => {
            chrome.storage.local.get("credentials", ({ credentials = {} }) => {
                delete credentials[url];
                chrome.storage.local.set({ credentials }, () => {
                    alert("削除しました");
                    renderTable(credentials, document.getElementById("search").value);
                });
            });
        });

        actionsCell.appendChild(updateBtn);
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}

document.getElementById("search").addEventListener("input", () => {
    chrome.storage.local.get("credentials", ({ credentials = {} }) => {
        renderTable(credentials, document.getElementById("search").value);
    });
});

document.getElementById("export").addEventListener("click", () => {
    chrome.storage.local.get("credentials", ({ credentials = {} }) => {
        const blob = new Blob([JSON.stringify(credentials, null, 4)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "credentials_export.json";
        a.click();
        URL.revokeObjectURL(url);
    });
});

document.getElementById("import").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);
            chrome.storage.local.get("credentials", ({ credentials = {} }) => {
                const merged = { ...credentials, ...imported };
                chrome.storage.local.set({ credentials: merged }, () => {
                    alert("インポート完了");
                    renderTable(merged, document.getElementById("search").value);
                });
            });
        } catch (err) {
            alert("インポートに失敗しました");
        }
    };
    reader.readAsText(file);
});

// 初期ロード
chrome.storage.local.get("credentials", ({ credentials = {} }) => {
    renderTable(credentials);
});
