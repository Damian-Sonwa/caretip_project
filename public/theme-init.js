(function () {
  try {
    var saved = localStorage.getItem("caretip-theme");
    var mode =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    if (mode === "dark") document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = mode;
  } catch {
    /* ignore */
  }
})();
