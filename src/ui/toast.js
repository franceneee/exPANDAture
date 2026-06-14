const TOAST_TIMEOUT_MS = 3500;
let dismissTimer;

export function showToast(message, type = "success") {
    const toast = document.getElementById("app-toast");
    const messageElement = document.getElementById("app-toast-message");
    if (!toast || !messageElement) return;

    clearTimeout(dismissTimer);
    messageElement.textContent = message;
    toast.className = `app-toast ${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.hidden = false;

    dismissTimer = setTimeout(() => {
        toast.hidden = true;
    }, TOAST_TIMEOUT_MS);
}
