/**
 * antiblock.js
 *
 * - Removes injected filter overlays (Blocksi, GoGuardian, etc.)
 * - Retries blocked images using a safe proxy
 * - Prevents redirect/script hijacking without breaking Firefox
 */

(() => {
  console.log("[AntiBlock] Initializing...");

  // ===================================================
  // 1. DOM CLEANER (FILTER / OVERLAY REMOVAL)
  // ===================================================

  const badKeywords = [
    "blocksi", "bl0cksi", "webfilter", "filtering",
    "blocked", "overlay", "bsecure", "securly", "goguardian"
  ];

  function shouldRemove(node) {
    if (!node || node.nodeType !== 1) return false;

    const haystack = (
      (node.id || "") + " " +
      (node.className || "") + " " +
      (node.getAttribute?.("name") || "")
    ).toLowerCase();

    return badKeywords.some(k => haystack.includes(k));
  }

  function clean(node) {
    try {
      if (shouldRemove(node)) {
        console.warn("[AntiBlock] Removed element:", node);
        node.remove();
        return;
      }

      if (node.tagName === "IFRAME" && node.src) {
        const src = node.src.toLowerCase();
        if (badKeywords.some(k => src.includes(k))) {
          console.warn("[AntiBlock] Removed blocking iframe:", node.src);
          node.remove();
        }
      }
    } catch (_) {}
  }

  // Initial sweep
  document.querySelectorAll("*").forEach(clean);

  // Mutation observer
  const domObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        clean(n);
        if (n.querySelectorAll) {
          n.querySelectorAll("*").forEach(clean);
        }
      }
    }
  });

  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // ===================================================
  // 2. IMAGE UNBLOCKER (SAFE PROXY RETRY)
  // ===================================================

  window.addEventListener(
    "error",
    e => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;

      if (img.dataset.proxyTried === "1") return;

      console.warn("[AntiBlock] Image blocked:", img.src);
      img.dataset.proxyTried = "1";

      img.src = "https://wsrv.nl/?url=" + encodeURIComponent(img.src);
    },
    true
  );

  // ===================================================
  // 3. HARD NAVIGATION SHIELD (FIREFOX SAFE)
  // ===================================================

  const allowedHosts = [
    location.hostname,
    "lolfactor39.github.io",
    "mathlearnhub.github.io",
    "track-study-9f2eb.firebaseapp.com",
    "track-study-9f2eb.web.app",
    "track-study-9f2eb-default-rtdb.firebaseio.com"
  ];

  function hostAllowed(host) {
    return allowedHosts.some(h => host === h || host.endsWith("." + h));
  }

  function isSafe(url) {
    try {
      if (!url) return true;
      if (url.startsWith("about:")) return true;

      const u = new URL(url, location.href);
      if (!hostAllowed(u.hostname)) return false;

      // Lock GitHub Pages to /chat/
      if (
        u.hostname === "lolfactor39.github.io" &&
        !u.pathname.startsWith("/chat/")
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  function block(url) {
    console.error("🚨 BLOCKED redirect/script:", url);
    return null;
  }

  // --- SAFE overrides (NO href redefine) ---
  const realAssign = location.assign.bind(location);
  const realReplace = location.replace.bind(location);

  location.assign = url => (isSafe(url) ? realAssign(url) : block(url));
  location.replace = url => (isSafe(url) ? realReplace(url) : block(url));

  const realPush = history.pushState.bind(history);
  const realReplaceState = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    if (url && !isSafe(url)) return block(url);
    return realPush(state, title, url);
  };

  history.replaceState = function (state, title, url) {
    if (url && !isSafe(url)) return block(url);
    return realReplaceState(state, title, url);
  };

  window.open = function (url) {
    if (url && !isSafe(url)) return block(url);
    return null;
  };

  // ===================================================
  // 4. SCRIPT INJECTION BLOCKER
  // ===================================================

  const scriptObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (
          n.tagName === "SCRIPT" &&
          n.src &&
          !isSafe(n.src)
        ) {
          console.warn("[AntiBlock] Removed injected script:", n.src);
          n.remove();
        }
      }
    }
  });

  scriptObserver.observe(document, {
    childList: true,
    subtree: true
  });

  // ===================================================
  // STATUS
  // ===================================================

  console.log("[AntiBlock] DOM cleaner active");
  console.log("[AntiBlock] Image proxy active");
  console.log("[Redirect Shield] Active");
  console.log("[AntiBlock] All protections running");
})();
