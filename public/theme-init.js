(function () {
  try {
    var saved = localStorage.getItem("caretip-theme");
    var preference =
      saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
    var resolved =
      preference === "system"
        ? window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : preference;
    if (resolved === "dark") document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.dataset.theme = resolved;
  } catch {
    /* ignore */
  }
})();
