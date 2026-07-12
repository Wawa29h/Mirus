const QUIZ_QUESTIONS_RUTA = [
  {
    id: "clima",
    question: "¿Qué clima te inspira a salir a explorar?",
    hint: "Piensa en cómo te sientes cuando un lugar te recibe.",
    options: [
      "Brisa fresca y sombra",
      "Sol radiante y calorcito",
      "Me adapto a lo que venga",
    ],
  },
  {
    id: "paisaje",
    question: "¿Qué escenarios te emocionan más?",
    hint: "No hay respuesta incorrecta — solo lo que te mueve.",
    options: [
      "Cascadas, ríos y senderos verdes",
      "Playas, olas y atardeceres",
      "Pueblos, café y calles con historia",
      "Volcanes, miradores y cielo abierto",
      "Me gusta mezclar de todo",
    ],
  },
  {
    id: "biodiversidad",
    question: "¿Te atraen las experiencias con la naturaleza viva?",
    hint: "Por ejemplo: avistar aves, ver tortugas o recorrer reservas naturales.",
    options: [
      "¡Sí! Fauna como aves y tortugas",
      "Bosques, plantas y ecosistemas",
      "Solo si es tranquilo y respetuoso",
      "Prefiero otras experiencias",
    ],
  },
  {
    id: "multitudes",
    question: "¿Cómo te gusta sentir un lugar cuando lo visitas?",
    options: [
      "Con vida, gente y buena energía",
      "Íntimo, silencioso y sin prisa",
      "Un equilibrio entre ambos",
    ],
  },
  {
    id: "entorno_laboral",
    question: "¿Desde qué ritmo de vida sueles planear tus escapadas?",
    hint: "Nos ayuda a entender cuándo y cómo te gustaría descubrir.",
    options: [
      "Desde oficina o empresa",
      "Desde trabajo de campo o aire libre",
      "Desde casa, remoto o freelance",
      "Desde el campus o estudios",
      "Desde otro ritmo distinto",
    ],
  },
];

const QUIZ_QUESTIONS_AVENTURA = [
  {
    id: "entorno",
    question: "¿De qué entorno vienes?",
    hint: "Tu punto de partida nos ayuda a contrastar o complementar tu aventura.",
    options: [
      "Ciudad y ritmo urbano",
      "Costa o cerca del mar",
      "Montaña o zona rural",
      "Pueblo con historia",
      "Un poco de todo",
    ],
  },
  {
    id: "experiencia",
    question: "¿Qué experiencia quieres vivir?",
    hint: "Elige el tipo de aventura que más te llama ahora.",
    options: [
      "Acción y adrenalina",
      "Relajación y desconexión",
      "Gastronómica",
      "Arqueológica",
      "Monumentos emblemáticos",
      "Naturaleza",
    ],
  },
  {
    id: "escenario",
    question: "¿Qué escenarios quieres explorar?",
    hint: "Piensa en el paisaje que quieres tener delante.",
    options: [
      "Playas y costa",
      "Volcanes y miradores",
      "Cascadas y senderos verdes",
      "Pueblos y calles con historia",
      "Me gusta mezclar de todo",
    ],
  },
  {
    id: "intensidad",
    question: "¿Qué ritmo de aventura prefieres?",
    options: [
      "Intensa: caminar, surfear, explorar sin parar",
      "Suave: pausas, vistas y buen café",
      "Un equilibrio entre ambos",
    ],
  },
  {
    id: "ambiente",
    question: "¿Cómo te gusta sentir los lugares?",
    options: [
      "Con vida, gente y buena energía",
      "Íntimo, silencioso y sin prisa",
      "Un equilibrio entre ambos",
    ],
  },
];

const QUIZ_BY_MODE = {
  ruta: QUIZ_QUESTIONS_RUTA,
  aventura: QUIZ_QUESTIONS_AVENTURA,
};

const MODE_LABELS = {
  ruta: "Modo ruta",
  aventura: "Modo aventura",
};

const INTRO_COPY = {
  ruta: {
    title: "Queremos conocer tus gustos",
    text: "Cuéntanos qué te interesa para recomendarte rutas, lugares y actividades que vayan contigo. Es rápido y solo eliges opciones.",
  },
  aventura: {
    title: "Queremos conocer tu estilo de aventura",
    text: "Cuéntanos de dónde vienes y qué experiencias quieres vivir: acción, relajación, gastronomía, arqueología, monumentos o naturaleza. Así armamos tu ruta de exploración.",
  },
};

let activeMode = null;
let currentStep = 0;
let answers = {};

const welcomeEl = document.getElementById("onboarding-welcome");
const quizEl = document.getElementById("onboarding-quiz");
const modeLabelEl = document.getElementById("onboarding-mode-label");
const titleEl = document.getElementById("onboarding-title");
const messageEl = document.getElementById("onboarding-message");
const startButton = document.getElementById("onboarding-start");
const progressEl = document.getElementById("quiz-progress");
const progressFillEl = document.getElementById("quiz-progress-fill");
const questionEl = document.getElementById("quiz-question");
const hintEl = document.getElementById("quiz-hint");
const introModeEl = document.getElementById("quiz-intro-mode");
const introTitleEl = document.getElementById("quiz-intro-title");
const introEl = document.getElementById("quiz-intro");
const optionsEl = document.getElementById("quiz-options");

function getQuestionsForMode(mode) {
  return QUIZ_BY_MODE[mode] || QUIZ_QUESTIONS_RUTA;
}

function getOnboardingKey(mode) {
  return `twinmap-onboarding-${mode}`;
}

function getQuizKey(mode) {
  return `twinmap-quiz-${mode}`;
}

function isOnboardingComplete(mode) {
  return localStorage.getItem(getOnboardingKey(mode)) === "done";
}

function getSavedQuiz(mode) {
  try {
    const raw = localStorage.getItem(getQuizKey(mode));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveQuiz(mode, quizAnswers) {
  localStorage.setItem(getQuizKey(mode), JSON.stringify(quizAnswers));
  localStorage.setItem(getOnboardingKey(mode), "done");
}

function renderQuestion() {
  const questions = getQuestionsForMode(activeMode);
  const question = questions[currentStep];
  const total = questions.length;

  progressEl.textContent = `Pregunta ${currentStep + 1} de ${total}`;
  progressFillEl.style.width = `${((currentStep + 1) / total) * 100}%`;
  questionEl.textContent = question.question;

  if (question.hint) {
    hintEl.textContent = question.hint;
    hintEl.hidden = false;
  } else {
    hintEl.textContent = "";
    hintEl.hidden = true;
  }

  optionsEl.innerHTML = question.options
    .map(
      (option) => `
        <button class="quiz-option" type="button" data-value="${option}">
          ${option}
        </button>
      `,
    )
    .join("");

  optionsEl.querySelectorAll(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => selectOption(question.id, button.dataset.value, button));
  });
}

function selectOption(questionId, value, button) {
  const questions = getQuestionsForMode(activeMode);

  optionsEl.querySelectorAll(".quiz-option").forEach((node) => {
    node.classList.remove("is-selected");
  });
  button.classList.add("is-selected");
  answers[questionId] = value;

  window.setTimeout(() => {
    if (currentStep < questions.length - 1) {
      currentStep += 1;
      renderQuestion();
      return;
    }

    finishOnboarding();
  }, 220);
}

function showWelcome() {
  welcomeEl.hidden = false;
  quizEl.hidden = true;
}

function showQuiz() {
  welcomeEl.hidden = true;
  quizEl.hidden = false;
  currentStep = 0;
  answers = {};
  renderQuestion();
}

function finishOnboarding() {
  saveQuiz(activeMode, answers);
  if (activeMode === "aventura") {
    localStorage.removeItem("twinmap-aventura-route");
  }
  document.body.classList.remove("is-onboarding");
  window.TwinmapApp.enterMode(activeMode);
}

function startOnboarding(mode) {
  activeMode = mode;
  const copy = INTRO_COPY[mode] || INTRO_COPY.ruta;

  modeLabelEl.textContent = MODE_LABELS[mode] || "Twinmap";
  titleEl.textContent = copy.title;
  messageEl.textContent = copy.text;
  introModeEl.textContent = MODE_LABELS[mode] || "Twinmap";
  introTitleEl.textContent = copy.title;
  introEl.textContent = copy.text;
  showQuiz();
  window.TwinmapApp.showView("onboarding");
}

window.TwinmapOnboarding = {
  start(mode) {
    startOnboarding(mode);
  },
  getAnswers: getSavedQuiz,
  reset(mode) {
    localStorage.removeItem(getOnboardingKey(mode));
    localStorage.removeItem(getQuizKey(mode));
    if (mode === "aventura") {
      localStorage.removeItem("twinmap-aventura-route");
    }
  },
};

function bindRetakeQuiz(buttonId) {
  document.getElementById(buttonId)?.addEventListener("click", () => {
    const mode = buttonId === "retake-quiz-aventura" ? "aventura" : "ruta";
    window.TwinmapOnboarding.reset(mode);
    startOnboarding(mode);
  });
}

bindRetakeQuiz("retake-quiz");
bindRetakeQuiz("retake-quiz-aventura");
