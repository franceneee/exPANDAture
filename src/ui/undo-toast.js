const UNDO_TIMEOUT_MS = 6000;
let dismissTimer;

export function showUndoToast(message, onUndo) {
    const toast = document.getElementById("undo-toast");
    const messageElement = document.getElementById("undo-toast-message");
    const undoButton = document.getElementById("undo-toast-button");

    clearTimeout(dismissTimer);
    messageElement.textContent = message;
    toast.hidden = false;

    undoButton.onclick = async () => {
        undoButton.disabled = true;
        try {
            await onUndo();
            hideUndoToast();
        } finally {
            undoButton.disabled = false;
        }
    };

    dismissTimer = setTimeout(hideUndoToast, UNDO_TIMEOUT_MS);
}

function hideUndoToast() {
    clearTimeout(dismissTimer);
    document.getElementById("undo-toast").hidden = true;
}
