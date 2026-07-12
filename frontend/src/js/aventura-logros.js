const AVENTURA_LOGROS = [
  { id: "primera-parada", title: "Primera parada", description: "Completaste tu primera parada de aventura.", unlocked: true },
  { id: "ruta-costera", title: "Ruta costera", description: "Visitaste 2 playas en una misma ruta.", unlocked: true },
  { id: "gourmet", title: "Gourmet local", description: "Probaste un restaurante recomendado en tu ruta.", unlocked: false },
  { id: "explorador", title: "Explorador", description: "Regeneraste tu ruta 3 veces.", unlocked: false },
  { id: "coleccionista", title: "Coleccionista", description: "Guardaste 5 lugares en favoritos.", unlocked: false },
  { id: "ruta-completa", title: "Ruta completa", description: "Completaste todas las paradas de tu ruta.", unlocked: false },
];

const statsEl = document.getElementById("aventura-logros-stats");
const listEl = document.getElementById("aventura-logros-list");

function padStat(value) {
  return String(value).padStart(2, "0");
}

function getAventuraStats() {
  const route = window.TwinmapAventuraRoute?.getCurrentRoute() || [];
  const favoritos = window.TwinmapAventuraFavoritos?.getAll() || [];
  const playas = route.filter((place) => place.type === "playa").length;
  const restaurantes = route.filter((place) => place.type === "restaurante").length;

  return {
    paradas: route.length,
    playas,
    favoritos: favoritos.length,
    restaurantes,
  };
}

function renderStats() {
  if (!statsEl) return;

  const stats = getAventuraStats();
  const items = [
    { value: stats.paradas, label: "Paradas en ruta" },
    { value: stats.playas, label: "Playas incluidas" },
    { value: stats.favoritos, label: "Favoritos guardados" },
    { value: stats.restaurantes, label: "Restaurantes en ruta" },
  ];

  statsEl.innerHTML = items
    .map(
      (item) => `
        <div>
          <strong>${padStat(item.value)}</strong>
          <span>${item.label}</span>
        </div>
      `,
    )
    .join("");
}

function renderLogros() {
  if (!listEl) return;

  const favoritosCount = window.TwinmapAventuraFavoritos?.getAll().length || 0;
  const dynamic = AVENTURA_LOGROS.map((logro) => {
    if (logro.id === "coleccionista" && favoritosCount >= 5) {
      return { ...logro, unlocked: true };
    }
    return logro;
  });

  listEl.innerHTML = dynamic
    .map(
      (logro) => `
        <article class="aventura-logro-card ${logro.unlocked ? "is-unlocked" : "is-locked"}">
          <span class="aventura-logro-card__badge" aria-hidden="true">${logro.unlocked ? "✓" : "○"}</span>
          <div>
            <h3>${logro.title}</h3>
            <p>${logro.description}</p>
            <small>${logro.unlocked ? "Desbloqueado" : "Por desbloquear"}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function refreshAventuraLogros() {
  renderStats();
  renderLogros();
}

window.addEventListener("twinmap-aventura-route-change", refreshAventuraLogros);

function initAventuraLogros() {
  if (!statsEl && !listEl) return;
  refreshAventuraLogros();
}

initAventuraLogros();

window.TwinmapAventuraLogros = {
  refresh: refreshAventuraLogros,
};
