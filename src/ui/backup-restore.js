import { downloadBackup, getBackupSummary, parseBackupFile, restoreBackup } from "../features/backup.js";
import { showToast } from "./toast.js";

export function setupBackupRestore(onRestoreComplete) {
    const exportButton = document.getElementById("backup-export-btn");
    const form = document.getElementById("restore-form");
    const fileInput = document.getElementById("restore-file");
    const preview = document.getElementById("restore-preview");
    let selectedBackup = null;

    exportButton.onclick = async () => {
        try {
            await downloadBackup();
            showToast("Full backup downloaded.");
        } catch (error) {
            showToast(error.message || "Could not create backup.", "error");
        }
    };

    fileInput.onchange = async () => {
        selectedBackup = null;
        preview.textContent = "";

        try {
            selectedBackup = await parseBackupFile(fileInput.files[0]);
            const summary = getBackupSummary(selectedBackup);
            const exportedDate = new Date(summary.exportedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short"
            });
            preview.textContent =
                `${summary.expenses} expenses and ${summary.categories} baskets from ${exportedDate}.`;
        } catch (error) {
            preview.textContent = error.message;
            showToast(error.message, "error");
        }
    };

    form.onsubmit = async event => {
        event.preventDefault();

        try {
            const backup = selectedBackup || await parseBackupFile(fileInput.files[0]);
            const mode = form.querySelector('input[name="restore-mode"]:checked').value;
            await restoreBackup(backup, mode);
            await onRestoreComplete();
            form.reset();
            preview.textContent = "";
            selectedBackup = null;
            showToast(mode === "replace" ? "Backup restored. Safety copy downloaded." : "Backup merged.");
        } catch (error) {
            showToast(error.message || "Could not restore backup.", "error");
        }
    };
}
