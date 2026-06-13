const THEME_KEY = "expandature_theme";
const THEMES = ["panda", "red-panda"];

const themeCopy = {
  panda: {
    kicker: "MY BAMBOO BUDGET",
    note: "Small bites add up. Keep it calm, keep it tracked.",
    nextLabel: "Red panda",
    nextAria: "Switch to red panda theme",
    themeColor: "#2f6047"
  },
  "red-panda": {
    kicker: "RED PANDA FIELD NOTES",
    note: "Every little forage tells a story. Keep your den comfortably stocked.",
    nextLabel: "Giant panda",
    nextAria: "Switch to giant panda theme",
    themeColor: "#8d3926"
  }
};

function currentTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return THEMES.includes(saved) ? saved : "panda";
}

export function applyTheme(theme) {
  const selected = THEMES.includes(theme) ? theme : "panda";
  const copy = themeCopy[selected];
  document.documentElement.dataset.theme = selected;
  document.getElementById("brand-kicker").textContent = copy.kicker;
  document.getElementById("mascot-note").textContent = copy.note;
  document.getElementById("theme-toggle-label").textContent = copy.nextLabel;
  document.getElementById("theme-toggle").setAttribute("aria-label", copy.nextAria);
  document.querySelector('meta[name="theme-color"]').content = copy.themeColor;
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.classList.toggle("selected", button.dataset.themeChoice === selected);
  });
  localStorage.setItem(THEME_KEY, selected);
}

export function setupThemeToggle() {
  applyTheme(currentTheme());
  document.getElementById("theme-toggle").onclick = () => {
    applyTheme(document.documentElement.dataset.theme === "panda" ? "red-panda" : "panda");
  };
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.onclick = () => applyTheme(button.dataset.themeChoice);
  });
}
