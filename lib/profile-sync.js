/**
 * Puente entre el quiz del frontend (onboarding) y mirusProfile del mapa.
 * Carga en index.html y frontend/index.html.
 */
(function () {
  const FRONTEND_QUIZ_KEY = "twinmap-quiz-ruta";
  const PROFILE_KEY = "twinmapProfile";

  function mapFrontendAnswers(answers) {
    if (!answers || typeof answers !== "object") return null;

    const clima = answers.clima || "";
    const paisaje = answers.paisaje || "";
    const bio = answers.biodiversidad || "";
    const multitudes = answers.multitudes || "";
    const entorno = answers.entorno_laboral || "";

    let pace = "balance";
    if (clima.includes("Sol") || multitudes.includes("vida")) pace = "flash";
    else if (clima.includes("Brisa") || multitudes.includes("ntimo")) pace = "zen";

    let interest = "playa";
    if (bio.includes("Fauna") || bio.includes("aves")) interest = "aves";
    else if (bio.includes("Bosques") || paisaje.includes("Cascadas") || paisaje.includes("Volcanes")) interest = "naturaleza";
    else if (paisaje.includes("Playas")) interest = "playa";
    else if (paisaje.includes("Pueblos")) interest = "cultura";
    else if (paisaje.includes("mezclar")) interest = "naturaleza";

    let crowds = "ok";
    if (multitudes.includes("vida")) crowds = "like";
    else if (multitudes.includes("ntimo")) crowds = "avoid";

    let transport = "driving";
    if (entorno.includes("campo")) transport = "walking";
    else if (entorno.includes("campus")) transport = "walking";
    else if (entorno.includes("remoto") || entorno.includes("oficina")) transport = "driving";

    return {
      pace,
      interest,
      crowds,
      transport,
      frontendQuiz: { ...answers },
      source: "frontend-onboarding",
      completedAt: new Date().toISOString(),
    };
  }

  function readFrontendQuiz() {
    try {
      const authKey = window.TwinmapAuth?.getProfileStorageKey?.("quiz-ruta");
      if (authKey) {
        const scoped = localStorage.getItem(authKey);
        if (scoped) return JSON.parse(scoped);
      }
      const raw = localStorage.getItem(FRONTEND_QUIZ_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function readProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function profileFromFrontendChanged(existing, mapped) {
    if (!existing?.frontendQuiz || !mapped?.frontendQuiz) return true;
    return JSON.stringify(existing.frontendQuiz) !== JSON.stringify(mapped.frontendQuiz);
  }

  function syncFromFrontendQuiz(force) {
    const answers = readFrontendQuiz();
    if (!answers) return readProfile();

    const mapped = mapFrontendAnswers(answers);
    if (!mapped) return readProfile();

    const existing = readProfile();
    if (force || !existing || profileFromFrontendChanged(existing, mapped)) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(mapped));
      return mapped;
    }
    return existing;
  }

  function saveFromFrontendQuiz(answers) {
    if (!answers) return null;
    localStorage.setItem(FRONTEND_QUIZ_KEY, JSON.stringify(answers));
    const mapped = mapFrontendAnswers(answers);
    if (mapped) localStorage.setItem(PROFILE_KEY, JSON.stringify(mapped));
    return mapped;
  }

  window.TwinmapProfileSync = {
    FRONTEND_QUIZ_KEY,
    PROFILE_KEY,
    mapFrontendAnswers,
    syncFromFrontendQuiz,
    saveFromFrontendQuiz,
    readFrontendQuiz,
    readProfile,
  };
})();
