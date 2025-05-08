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

interface Credentials {
    [url: string]: {
        username?: string;
        password?: string;
    };
}

function tryAutofillOrSave(credentials: Credentials) {
    const currentUrl = window.location.origin;
    console.log("[Autofill] Current URL:", currentUrl);

    const usernameField = getUsernameField();
    const passwordField = getPasswordField();

    if (credentials[currentUrl]) {
        const { username, password } = credentials[currentUrl];
        if (usernameField && username) usernameField.value = username;
        if (passwordField && password) passwordField.value = password;
        // const form = usernameField?.closest("form") || passwordField?.closest("form");
    } else {
        console.log("[Autofill] No credentials found and fields are empty or missing.");
    }
}

function setupInputListener(currentUrl: string, credentials: Credentials) {
    const form = document.querySelector("form");
    if (!form) return;

    form.addEventListener("submit", () => {
        const usernameField = getUsernameField();
        const passwordField = getPasswordField();

        if (
            usernameField && passwordField &&
            usernameField.value && passwordField.value &&
            !credentials[currentUrl] // Only save if not already present for this URL
        ) {
            const username = usernameField.value;
            const password = passwordField.value;
            const newCredentials = {
                ...credentials,
                [currentUrl]: { username, password }
            };
            chrome.storage.local.set({ credentials: newCredentials }, () => {
                console.log("[Autofill] Saved credentials on form submit for", currentUrl);
            });
        }
    });
}

chrome.storage.local.get("credentials", (result) => {
    const credentials = (result.credentials || {}) as Credentials;
    tryAutofillOrSave(credentials);
    setupInputListener(window.location.origin, credentials);
});

// To ensure the types are correct for chrome storage
// You might want to define a more specific type for your credentials
// For example:
// interface StoredCredentials {
//   credentials?: Credentials;
// }
// chrome.storage.local.get("credentials", (result: StoredCredentials) => { ... });

console.log("Content script loaded for Password Autofill.");