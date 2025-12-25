import { CURRENCIES, DEFAULT_CURRENCY } from "../models/constants.js";

export function populateCurrencySelect() {
    const select = document.getElementById("currency");
    if (!select) return;

    select.innerHTML = "";

    CURRENCIES.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.code;
        opt.textContent = c.label;
        if (c.code === DEFAULT_CURRENCY) opt.selected = true;
        select.appendChild(opt);
    });
}
