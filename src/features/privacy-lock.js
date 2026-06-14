const PIN_KEY = "expandature_pin";
const LOCK_AFTER_MS = 2 * 60 * 1000;
let inactivityTimer;

const bytesToBase64 = bytes => btoa(String.fromCharCode(...bytes));
const base64ToBytes = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));

async function derivePin(pin, salt) {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, material, 256);
    return bytesToBase64(new Uint8Array(bits));
}

function getStoredPin() {
    const value = localStorage.getItem(PIN_KEY);
    return value ? JSON.parse(value) : null;
}

function updateLockButton() {
    document.getElementById("lock-now-header").hidden = !getStoredPin();
}

async function savePin(pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(PIN_KEY, JSON.stringify({ salt: bytesToBase64(salt), hash: await derivePin(pin, salt) }));
}

async function pinMatches(pin) {
    const stored = getStoredPin();
    return !stored || await derivePin(pin, base64ToBytes(stored.salt)) === stored.hash;
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (getStoredPin()) inactivityTimer = setTimeout(lockApp, LOCK_AFTER_MS);
}

function lockApp() {
    if (!getStoredPin()) return;
    document.getElementById("lock-screen").hidden = false;
    document.getElementById("unlock-pin").value = "";
    document.getElementById("unlock-message").textContent = "";
    setTimeout(() => document.getElementById("unlock-pin").focus(), 50);
}

export function setupPrivacyLock() {
    const unlockForm = document.getElementById("unlock-form");
    const setupForm = document.getElementById("pin-setup-form");

    unlockForm.onsubmit = async event => {
        event.preventDefault();
        if (await pinMatches(unlockForm.pin.value)) {
            document.getElementById("lock-screen").hidden = true;
            resetInactivityTimer();
        } else {
            document.getElementById("unlock-message").textContent = "That PIN did not match. Try again.";
            unlockForm.pin.select();
        }
    };

    setupForm.onsubmit = async event => {
        event.preventDefault();
        const message = document.getElementById("pin-setup-message");
        if (!/^\d{4,12}$/.test(setupForm.pin.value)) {
            message.textContent = "Use 4-12 numbers.";
            return;
        }
        await savePin(setupForm.pin.value);
        setupForm.reset();
        message.textContent = "PIN saved. The grove will auto-lock after 2 minutes.";
        updateLockButton();
        resetInactivityTimer();
    };

    document.getElementById("lock-now-header").onclick = lockApp;
    document.getElementById("lock-now-settings").onclick = lockApp;
    ["pointerdown", "keydown", "touchstart"].forEach(name => document.addEventListener(name, resetInactivityTimer, { passive: true }));
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && getStoredPin()) lockApp();
    });
    updateLockButton();
    if (getStoredPin()) lockApp();
}
