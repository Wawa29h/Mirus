const printRootId = "aventura-print-root";

function formatShareDate(iso) {
  try {
    return new Intl.DateTimeFormat("es-SV", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso || new Date().toLocaleDateString("es-SV");
  }
}

function renderQuizSection(quiz) {
  if (!quiz || !Object.values(quiz).some(Boolean)) return "";

  const isAdventureQuiz = Boolean(quiz.experiencia || quiz.entorno || quiz.escenario);
  const items = isAdventureQuiz
    ? [
        quiz.entorno && { label: "De dónde vienes", value: quiz.entorno },
        quiz.experiencia && { label: "Experiencia", value: quiz.experiencia },
        quiz.escenario && { label: "Escenarios", value: quiz.escenario },
        quiz.intensidad && { label: "Ritmo", value: quiz.intensidad },
        quiz.ambiente && { label: "Ambiente", value: quiz.ambiente },
      ]
    : [
        quiz.paisaje && { label: "Paisaje", value: quiz.paisaje },
        quiz.clima && { label: "Clima ideal", value: quiz.clima },
        quiz.biodiversidad && { label: "Biodiversidad", value: quiz.biodiversidad },
        quiz.multitudes && { label: "Ambiente", value: quiz.multitudes },
      ].filter(Boolean);

  const visibleItems = items.filter(Boolean);

  if (!visibleItems.length) return "";

  return `
    <section class="aventura-print__quiz">
      <h2>Tu vibe de aventura</h2>
      <ul>
        ${visibleItems.map((item) => `<li><strong>${item.label}:</strong> ${item.value}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderStopsSection(stops) {
  if (!stops?.length) {
    return "<p>Sin paradas en esta ruta.</p>";
  }

  return `
    <ol class="aventura-print__stops">
      ${stops
        .map(
          (stop, index) => `
        <li>
          <span class="aventura-print__stop-order">${index + 1}</span>
          <div>
            <strong>${stop.name}</strong>
            <span>${stop.categoryLabel || stop.category || "Lugar"} · ${stop.location || ""}</span>
            ${stop.description ? `<p>${stop.description}</p>` : ""}
          </div>
        </li>
      `,
        )
        .join("")}
    </ol>
  `;
}

function buildPrintHtml({ routeName, stops, quiz, summary, createdAt, rating, tags }) {
  const tagLabels = (tags || [])
    .map((id) => {
      const labels = {
        loca: "🤪 Loca",
        entretenida: "🎉 Entretenida",
        epica: "⚡ Épica",
        chill: "😎 Chill",
        gastronomica: "🍽️ Gastronómica",
        salvaje: "🌿 Salvaje",
      };
      return labels[id] || id;
    })
    .join(" · ");

  return `
    <div class="aventura-print">
      <header class="aventura-print__header">
        <p class="aventura-print__brand">Twinmap · Modo aventura</p>
        <h1>${routeName || "Mi ruta de aventura"}</h1>
        <p class="aventura-print__meta">${formatShareDate(createdAt || new Date().toISOString())}</p>
        ${rating ? `<p class="aventura-print__rating">${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)</p>` : ""}
        ${tagLabels ? `<p class="aventura-print__tags">${tagLabels}</p>` : ""}
      </header>

      ${summary ? `<p class="aventura-print__summary">${summary}</p>` : ""}

      <section class="aventura-print__itinerary">
        <h2>Paradas del recorrido</h2>
        ${renderStopsSection(stops)}
      </section>

      ${renderQuizSection(quiz)}

      <footer class="aventura-print__footer">
        <p>Generado con Twinmap — ¡Comparte esta aventura con tus amigos!</p>
      </footer>
    </div>
  `;
}

function getOrCreatePrintRoot() {
  let root = document.getElementById(printRootId);
  if (!root) {
    root = document.createElement("div");
    root.id = printRootId;
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
  }
  return root;
}

function sharePayload(payload) {
  const root = getOrCreatePrintRoot();
  root.innerHTML = buildPrintHtml(payload);
  root.setAttribute("data-printing", "true");

  const cleanup = () => {
    root.removeAttribute("data-printing");
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}

function shareCurrentRoute() {
  const places = window.TwinmapAventuraRoute?.getCurrentRoute() || [];
  if (!places.length) {
    window.TwinmapRoute?.showRouteToast("No hay ruta activa para compartir");
    return;
  }

  const quiz = window.TwinmapOnboarding?.getAnswers("aventura") || {};
  const categories = [...new Set(places.map((p) => p.categoryLabel))].slice(0, 2).join(" + ");

  sharePayload({
    routeName: `Ruta de aventura · ${categories || "El Salvador"}`,
    stops: places.map((p) => ({
      name: p.name,
      categoryLabel: p.categoryLabel,
      location: p.location,
      description: p.description,
    })),
    quiz,
    summary: `${places.length} paradas listas para explorar. ¡Mándasela a tus amigos!`,
    createdAt: new Date().toISOString(),
    rating: 0,
    tags: [],
  });
}

function shareEntry(entry) {
  if (!entry) return;
  sharePayload(entry);
}

function bindShareButtons() {
  document.getElementById("aventura-share-route")?.addEventListener("click", shareCurrentRoute);
}

bindShareButtons();

window.TwinmapAventuraShare = {
  shareCurrentRoute,
  shareEntry,
  sharePayload,
};
