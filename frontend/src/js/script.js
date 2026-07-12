const MODE_STORAGE_KEY = "twinmap-mode";
const ROUTE_MODE = "ruta";
const ADVENTURE_MODE = "aventura";

const viewButtons = document.querySelectorAll("[data-view]");
const modeButtons = document.querySelectorAll(".mode-grid [data-mode]");
const panels = document.querySelectorAll("[data-panel]");
const navLinks = document.querySelectorAll(".nav-link");
const brandModeEl = document.querySelector(".brand-mode");
const profileButton = document.querySelector(".profile-button");
const loginForm = document.getElementById("login-form");
const loginUsernameInput = document.getElementById("login-username");
const loginPasswordInput = document.getElementById("login-password");
const loginMessageEl = document.getElementById("login-message");
const loginActiveProfileEl = document.getElementById("login-active-profile");
const loginLogoutButton = document.getElementById("login-logout");

const routePanels = new Set([
  "inicio-app",
  "mapa",
  "mapa-personalizado",
  "mi-ruta",
  "bitacora",
  "favoritos",
  "emergencia",
  "configuracion",
]);

const adventurePanels = new Set([
  "aventura-mapa",
  "aventura-bitacora",
  "aventura-favoritos",
  "aventura-logros",
]);

const MODE_ENTRY = {
  [ROUTE_MODE]: "inicio-app",
  [ADVENTURE_MODE]: "aventura-mapa",
};

const MAP_EMBED_SRC = "/index.html?embed=1&ui=frontend&tourism=1&heat=1";
const MAP_PERSONALIZADO_SRC = "/index.html?embed=1&ui=frontend&shell=personalizado";

function ensureMapIframeLoaded() {
  const iframe = document.getElementById("twinmap-real-map");
  if (!iframe) return null;

  const wanted = iframe.dataset.src || MAP_EMBED_SRC;
  const absolute = new URL(wanted, location.origin).href;
  const current = iframe.getAttribute("src");

  if (!current || !current.includes("embed=1")) {
    iframe.src = absolute;
  }

  return iframe;
}

function pingEmbeddedMap() {
  const iframe = document.getElementById("twinmap-real-map");
  iframe?.contentWindow?.postMessage({
    type: "twinmap-embed-init",
    ui: "frontend",
    tourism: true,
    heat: true,
  }, "*");
  iframe?.contentWindow?.postMessage({ type: "twinmap-profile-updated" }, "*");
  iframe?.contentWindow?.postMessage({ type: "twinmap-resize" }, "*");
  [150, 400, 900, 1500, 2500].forEach((ms) => {
    window.setTimeout(() => {
      iframe?.contentWindow?.postMessage({ type: "twinmap-resize" }, "*");
    }, ms);
  });
}

function ensurePersonalizadoIframeLoaded() {
  const iframe = document.getElementById("twinmap-personalizado-map");
  if (!iframe) return null;

  const wanted = iframe.dataset.src || MAP_PERSONALIZADO_SRC;
  const absolute = new URL(wanted, location.origin).href;
  const current = iframe.getAttribute("src");

  if (!current || !current.includes("embed=1")) {
    iframe.src = absolute;
  }

  return iframe;
}

function pingPersonalizadoMap() {
  const iframe = ensurePersonalizadoIframeLoaded();
  iframe?.contentWindow?.postMessage({ type: "twinmap-embed-init", ui: "frontend", shell: "personalizado" }, "*");
  iframe?.contentWindow?.postMessage({ type: "twinmap-profile-updated" }, "*");
  iframe?.contentWindow?.postMessage({ type: "twinmap-resize" }, "*");
  [150, 400, 900, 1500, 2500].forEach((ms) => {
    window.setTimeout(() => {
      iframe?.contentWindow?.postMessage({ type: "twinmap-resize" }, "*");
    }, ms);
  });
}

function getSavedMode() {
  return sessionStorage.getItem(MODE_STORAGE_KEY);
}

function setActiveMode(mode) {
  if (mode) {
    sessionStorage.setItem(MODE_STORAGE_KEY, mode);
    document.body.dataset.mode = mode;
    if (brandModeEl) {
      brandModeEl.textContent = mode === ROUTE_MODE ? "Modo ruta" : "Modo aventura";
    }
  } else {
    sessionStorage.removeItem(MODE_STORAGE_KEY);
    delete document.body.dataset.mode;
    if (brandModeEl) {
      brandModeEl.textContent = "Mirus";
    }
  }
}

function showView(viewName, options = {}) {
  const target = viewName || "mode-select";
  const needsProfile =
    !options.skipProfileCheck &&
    (target === "mode-select" || routePanels.has(target) || adventurePanels.has(target));

  if (needsProfile && !window.TwinmapAuth?.hasProfile?.()) {
    showView("login", { skipProfileCheck: true });
    return;
  }

  const isRoutePanel = routePanels.has(target);
  const isAdventurePanel = adventurePanels.has(target);
  const isOnboarding = target === "onboarding";
  const savedMode = getSavedMode();

  if (isRoutePanel && savedMode !== ROUTE_MODE) {
    showView("mode-select");
    return;
  }

  if (isAdventurePanel && savedMode !== ADVENTURE_MODE) {
    showView("mode-select");
    return;
  }

  document.body.classList.toggle("has-topbar", isRoutePanel || isAdventurePanel);
  document.body.classList.toggle("is-onboarding", isOnboarding);

  panels.forEach((panel) => {
    panel.classList.toggle("is-visible", panel.dataset.panel === target);
  });

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === target);
  });

  if (target === "aventura-mapa") {
    window.TwinmapAventuraRoute?.render();
  }

  if (target === "aventura-bitacora") {
    window.TwinmapAventuraBitacora?.refresh();
  }

  if (target === "aventura-favoritos") {
    window.TwinmapAventuraFavoritos?.refresh();
  }

  if (target === "aventura-logros") {
    window.TwinmapAventuraLogros?.refresh();
  }

  if (target === "mapa") {
    window.TwinmapProfileSync?.syncFromFrontendQuiz?.();
    ensureMapIframeLoaded();
    pingEmbeddedMap();
  }

  if (target === "mapa-personalizado") {
    window.TwinmapProfileSync?.syncFromFrontendQuiz?.(true);
    ensurePersonalizadoIframeLoaded();
    pingPersonalizadoMap();
    window.TwinmapPersonalizado?.render();
  }

  if (target === "emergencia") {
    window.TwinmapEmergencia?.refresh();
  }

  if (target === "bitacora") {
    window.TwinmapBitacora?.refresh();
  }

  if (target === "favoritos") {
    window.TwinmapFavoritos?.refresh();
  }

  if (target === "login") {
    initLoginProviders();
  }

  if (target === "inicio-app") {
    window.TwinmapPersonalizado?.renderDashboard();
    window.TwinmapBitacora?.refresh();
  }

  if (options.scrollTo) {
    requestAnimationFrame(() => {
      const el = document.querySelector(options.scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("is-highlighted");
        window.setTimeout(() => el.classList.remove("is-highlighted"), 2500);
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function enterMode(mode) {
  setActiveMode(mode);
  showView(MODE_ENTRY[mode]);
}

function startMode(mode) {
  window.TwinmapOnboarding?.start(mode);
}

function returnToModeSelect() {
  setActiveMode(null);
  document.body.classList.remove("is-onboarding");
  showView("mode-select");
}

function setLoginMessage(text, tone = "") {
  if (!loginMessageEl) return;
  loginMessageEl.textContent = text || "";
  loginMessageEl.classList.remove("is-error", "is-success");
  if (tone) loginMessageEl.classList.add(tone);
}

function finishLogin(profile, message = "") {
  if (loginPasswordInput) loginPasswordInput.value = "";
  setLoginMessage(message, message ? "is-success" : "");
  updateProfileUI();
  showView("mode-select", { skipProfileCheck: true });
}

function initLoginProviders() {
  window.TwinmapAuth?.initGoogleSignIn?.({
    onSuccess: (result) => {
      const suffix = result.demo ? " (cuenta demo)" : "";
      finishLogin(result.profile, `Sesión iniciada con Google${suffix}.`);
    },
    onError: (error) => setLoginMessage(error, "is-error"),
  });
}

function updateProfileUI() {
  const profile = window.TwinmapAuth?.getProfile?.();

  if (profileButton) {
    profileButton.textContent = profile ? profile.name : "Perfil";
    profileButton.title = profile ? "Cambiar perfil" : "Iniciar sesión";
  }

  if (loginActiveProfileEl) {
    if (profile) {
      const provider =
        profile.authProvider === "google"
          ? "Google"
          : profile.authProvider === "local"
            ? "usuario/contraseña"
            : "perfil local";
      loginActiveProfileEl.textContent = `Sesión activa: ${profile.name} (${provider}). Puedes cambiar de cuenta abajo.`;
    } else {
      loginActiveProfileEl.textContent =
        "Si es tu primera vez, crearemos tu cuenta al iniciar sesión.";
    }
  }

  if (loginLogoutButton) {
    loginLogoutButton.hidden = !profile;
  }
}

viewButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    if (button.dataset.view === "mode-select" || button.dataset.view === "landing") {
      if (button.dataset.view === "landing") {
        returnToModeSelect();
        return;
      }
      setActiveMode(null);
      document.body.classList.remove("is-onboarding");
      showView("mode-select");
      return;
    }

    showView(button.dataset.view);
  });
});

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  setLoginMessage("");

  const username = loginUsernameInput?.value || "";
  const password = loginPasswordInput?.value || "";
  const result = window.TwinmapAuth?.loginLocal?.(username, password);

  if (!result?.ok) {
    setLoginMessage(result?.error || "No se pudo iniciar sesión.", "is-error");
    return;
  }

  const createdText = result.created
    ? "Cuenta creada. "
    : result.migrated
      ? "Perfil actualizado con contraseña. "
      : "";
  finishLogin(result.profile, `${createdText}Bienvenido, ${result.profile.name}.`);
});

loginLogoutButton?.addEventListener("click", () => {
  window.TwinmapAuth?.logout?.();
  setLoginMessage("Sesión cerrada.", "is-success");
  updateProfileUI();
});

profileButton?.addEventListener("click", () => {
  setActiveMode(null);
  document.body.classList.remove("is-onboarding");
  setLoginMessage("");
  showView("login", { skipProfileCheck: true });
  initLoginProviders();
});

window.addEventListener("twinmap-auth-change", () => {
  updateProfileUI();
  window.TwinmapBitacora?.refresh?.();
  window.TwinmapFavoritos?.refresh?.();
  window.TwinmapPersonalizado?.render?.();
  window.TwinmapPersonalizado?.renderDashboard?.();
  // Notificar iframes del mapa para refrescar favoritos/visitados por perfil
  pingEmbeddedMap();
  pingPersonalizadoMap();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    startMode(button.dataset.mode);
  });
});

window.TwinmapApp = {
  showView,
  enterMode,
  startMode,
  returnToModeSelect,
};

document.querySelectorAll(".map-search").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelector(".map-search__input")?.blur();
  });
});

updateProfileUI();

const quickView = new URLSearchParams(location.search).get("view");
if (quickView) {
  const quickMode = new URLSearchParams(location.search).get("mode") || ROUTE_MODE;
  if (quickMode === ROUTE_MODE || quickMode === ADVENTURE_MODE) {
    setActiveMode(quickMode);
    showView(quickView);
    if (quickView === "mapa") ensureMapIframeLoaded();
  }
} else {
  showView("landing");
}

const mapIframe = document.getElementById("twinmap-real-map");
if (mapIframe) {
  mapIframe.addEventListener("load", () => {
    pingEmbeddedMap();
  });
  window.addEventListener("resize", pingEmbeddedMap);
}

function handleEmbeddedPlaceMessage(event) {
  const { type, action, place, result: iframeResult } = event.data || {};
  if (!place?.name) return;

  if (type === "twinmap-place-changed") {
    if (iframeResult?.toggled || iframeResult?.added || iframeResult?.removed) {
      window.TwinmapFavoritos?.refresh?.();
      window.TwinmapBitacora?.refresh?.();
      window.TwinmapPersonalizado?.render?.();
      window.TwinmapPersonalizado?.renderDashboard?.();
    } else if (action === "favorite" && iframeResult?.active !== undefined) {
      window.TwinmapFavoritos?.refresh?.();
    }
    return;
  }

  let result;
  if (type === "twinmap-toggle-place" || type === "twinmap-save-place") {
    if (action === "favorite") {
      result = window.TwinmapFavoritos?.toggle?.(place)
        || window.TwinmapPlaceStorage?.toggleFavorite?.(place);
    } else {
      result = window.TwinmapPlaceStorage?.toggleVisited?.(place);
    }
  } else {
    return;
  }

  if (result?.toggled || result?.added || result?.removed) {
    window.TwinmapFavoritos?.refresh?.();
    window.TwinmapBitacora?.refresh?.();
    window.TwinmapPersonalizado?.render?.();
    window.TwinmapPersonalizado?.renderDashboard?.();

    if (event.source && event.source !== window) {
      event.source.postMessage(
        {
          type: "twinmap-place-toggle-result",
          action,
          place,
          result,
        },
        event.origin || "*",
      );
    }
  }
}

window.addEventListener("message", handleEmbeddedPlaceMessage);


