const MODE_STORAGE_KEY = "twinmap-mode";
const ROUTE_MODE = "ruta";
const ADVENTURE_MODE = "aventura";

const viewButtons = document.querySelectorAll("[data-view]");
const modeButtons = document.querySelectorAll(".mode-grid [data-mode]");
const panels = document.querySelectorAll("[data-panel]");
const navLinks = document.querySelectorAll(".nav-link");
const brandModeEl = document.querySelector(".brand-mode");

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
      brandModeEl.textContent = "Twinmap";
    }
  }
}

function showView(viewName, options = {}) {
  const target = viewName || "mode-select";
  const isRoutePanel = routePanels.has(target);
  const isAdventurePanel = adventurePanels.has(target);
  const isOnboarding = target === "onboarding";
  const savedMode = getSavedMode();

  if (isRoutePanel && savedMode !== ROUTE_MODE) {
    showView("landing");
    return;
  }

  if (isAdventurePanel && savedMode !== ADVENTURE_MODE) {
    showView("landing");
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

  if (target === "mapa-personalizado") {
    window.TwinmapPersonalizado?.render();
  }

  if (target === "emergencia") {
    window.TwinmapEmergencia?.refresh();
  }

  if (target === "bitacora") {
    window.TwinmapBitacora?.refresh();
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
  showView("landing");
}

viewButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    if (button.dataset.view === "mode-select") {
      returnToModeSelect();
      return;
    }

    showView(button.dataset.view);
  });
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

showView("landing");

