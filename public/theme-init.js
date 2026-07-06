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

    var shellBg = resolved === "dark" ? "#0f1116" : "#faf9f6";
    document.documentElement.style.backgroundColor = shellBg;

    function paintShellBg() {
      document.documentElement.style.backgroundColor = shellBg;
      if (document.body) document.body.style.backgroundColor = shellBg;
      var root = document.getElementById("root");
      if (root) root.style.backgroundColor = shellBg;
    }

    paintShellBg();
    document.addEventListener("DOMContentLoaded", paintShellBg);
  } catch {
    /* ignore */
  }
})();
