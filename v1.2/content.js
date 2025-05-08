function getUsernameField() {
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
    ].join(", "));
}

function getPasswordField() {
    return document.querySelector([
        "input[type='password']",
        "input[name*='pass' i]",
        "input[id*='pass' i]",
        "input[class*='pass' i]",
        "input[placeholder*='pass' i]",
        "input[aria-label*='pass' i]",
        "input[name='password']",
        "input[placeholder='Password']"
    ].join(", "));
}

function tryAutofillOrSave(credentials) {
    const currentUrl = window.location.origin;
    console.log("[Autofill] Current URL:", currentUrl);

    const usernameField = getUsernameField();
    const passwordField = getPasswordField();

    if (credentials[currentUrl]) {
        const { username, password } = credentials[currentUrl];
        if (usernameField) usernameField.value = username;
        if (passwordField) passwordField.value = password;
        const form = usernameField?.closest("form") || passwordField?.closest("form");
    } else {
        console.log("[Autofill] No credentials found and fields are empty or missing.");
    }
}

function setupInputListener(currentUrl, credentials) {
    const form = document.querySelector("form");
    if (!form) return;

    form.addEventListener("submit", () => {
        const usernameField = getUsernameField();
        const passwordField = getPasswordField();

        if (
            usernameField && passwordField &&
            usernameField.value && passwordField.value &&
            !credentials[currentUrl]
        ) {
            const username = usernameField.value;
            const password = passwordField.value;
            chrome.storage.local.set({
                credentials: {
                    ...credentials,
                    [currentUrl]: { username, password }
                }
            }, () => {
                console.log("[Autofill] Saved credentials on form submit for", currentUrl);
            });
        }
    });
}

chrome.storage.local.get("credentials", ({ credentials = {} }) => {
    tryAutofillOrSave(credentials);
    setupInputListener(window.location.origin, credentials);
});