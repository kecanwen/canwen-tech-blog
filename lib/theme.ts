export const THEME_STORAGE_KEY = "theme"

export type ThemeName = "light" | "dark"

export const themeInitScript = `(function(){
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(key);
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    var sync = function() {
      var color = root.getAttribute("data-theme") === "dark" ? "#212737" : "#FBFEFB";
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", color);
    };
    sync();
    document.addEventListener("DOMContentLoaded", sync);
  } catch (error) {}
})();`

export function readTheme(): ThemeName {
  if (typeof document === "undefined") return "light"
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", theme === "dark" ? "#212737" : "#FBFEFB")
}
