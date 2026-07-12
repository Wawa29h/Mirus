const TWINMAP_PROFILES_KEY = "twinmap-profiles";
const TWINMAP_ACTIVE_PROFILE_KEY = "twinmap-active-profile";
const GOOGLE_GIS_SCRIPT = "https://accounts.google.com/gsi/client";

function normalizeProfileName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function makeProfileId(name) {
  return normalizeProfileName(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeProfileIdFromUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return "";
  if (normalized.includes("@")) {
    return makeProfileId(normalized.split("@")[0]) || makeProfileId(normalized);
  }
  return makeProfileId(normalized);
}

function hashPassword(password) {
  let hash = 5381;
  const text = String(password || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return btoa(String(hash >>> 0));
}

function displayNameFromUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return "Viajero";
  if (normalized.includes("@")) {
    const local = normalized.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(TWINMAP_PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((profile) => ({
      ...profile,
      authProvider: profile.authProvider || "legacy",
    }));
  } catch {
    return [];
  }
}

function saveProfiles(profiles) {
  localStorage.setItem(TWINMAP_PROFILES_KEY, JSON.stringify(profiles));
}

function getActiveProfile() {
  const activeId = localStorage.getItem(TWINMAP_ACTIVE_PROFILE_KEY);
  if (!activeId) return null;

  return loadProfiles().find((profile) => profile.id === activeId) || null;
}

function setActiveProfile(profile) {
  localStorage.setItem(TWINMAP_ACTIVE_PROFILE_KEY, profile.id);
  window.dispatchEvent(new CustomEvent("twinmap-auth-change", { detail: { profile } }));
  return profile;
}

function upsertProfile(profile) {
  const profiles = loadProfiles();
  const index = profiles.findIndex((item) => item.id === profile.id);
  if (index >= 0) {
    profiles[index] = { ...profiles[index], ...profile };
  } else {
    profiles.push(profile);
  }
  saveProfiles(profiles);
  return profile;
}

function loginProfile(name) {
  const cleanName = normalizeProfileName(name);
  if (!cleanName) return null;

  const id = makeProfileId(cleanName) || `perfil-${Date.now()}`;
  const profiles = loadProfiles();
  let profile = profiles.find((item) => item.id === id);

  if (!profile) {
    profile = {
      id,
      name: cleanName,
      username: cleanName,
      authProvider: "legacy",
      createdAt: new Date().toISOString(),
    };
    upsertProfile(profile);
  }

  return setActiveProfile(profile);
}

function loginLocal(username, password) {
  const cleanUsername = normalizeUsername(username);
  const cleanPassword = String(password || "");
  if (!cleanUsername || !cleanPassword) {
    return { ok: false, error: "Usuario y contraseña son obligatorios." };
  }

  const id = makeProfileIdFromUsername(cleanUsername) || `user-${Date.now()}`;
  const profiles = loadProfiles();
  let profile = profiles.find((item) => item.id === id || item.username === cleanUsername);

  if (!profile) {
    profile = {
      id,
      name: displayNameFromUsername(cleanUsername),
      username: cleanUsername,
      email: cleanUsername.includes("@") ? cleanUsername : null,
      authProvider: "local",
      passwordHash: hashPassword(cleanPassword),
      createdAt: new Date().toISOString(),
    };
    upsertProfile(profile);
    return { ok: true, profile: setActiveProfile(profile), created: true };
  }

  if (profile.authProvider === "google") {
    return { ok: false, error: "Esta cuenta usa Google. Inicia sesión con Google." };
  }

  if (profile.authProvider === "legacy" && !profile.passwordHash) {
    profile.passwordHash = hashPassword(cleanPassword);
    profile.username = cleanUsername;
    profile.authProvider = "local";
    if (cleanUsername.includes("@")) profile.email = cleanUsername;
    upsertProfile(profile);
    return { ok: true, profile: setActiveProfile(profile), migrated: true };
  }

  if (profile.passwordHash !== hashPassword(cleanPassword)) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  return { ok: true, profile: setActiveProfile(profile) };
}

function decodeGoogleJwt(credential) {
  try {
    const payload = credential.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function upsertGoogleProfile(payload) {
  const sub = payload.sub || payload.googleSub;
  if (!sub) return null;

  const id = `google-${sub}`;
  const profiles = loadProfiles();
  let profile = profiles.find((item) => item.id === id || item.googleSub === sub);

  const nextProfile = {
    id,
    name: payload.name || payload.email || "Usuario Google",
    username: payload.email || id,
    email: payload.email || null,
    picture: payload.picture || null,
    authProvider: "google",
    googleSub: sub,
    createdAt: profile?.createdAt || new Date().toISOString(),
  };

  return upsertProfile(nextProfile);
}

function loginGoogleCredential(credential) {
  const payload = decodeGoogleJwt(credential);
  if (!payload?.sub) {
    return { ok: false, error: "No se pudo leer la cuenta de Google." };
  }

  const profile = upsertGoogleProfile(payload);
  if (!profile) {
    return { ok: false, error: "No se pudo crear el perfil de Google." };
  }

  return { ok: true, profile: setActiveProfile(profile) };
}

function loginGoogleDemo() {
  const profile = upsertGoogleProfile({
    sub: "demo-mirus-user",
    email: "demo@mirus.sv",
    name: "Demo Google Mirus",
    picture: null,
  });
  return { ok: true, profile: setActiveProfile(profile), demo: true };
}

function logoutProfile() {
  localStorage.removeItem(TWINMAP_ACTIVE_PROFILE_KEY);
  window.dispatchEvent(new CustomEvent("twinmap-auth-change", { detail: { profile: null } }));
}

function getProfileStorageKey(key) {
  const profile = getActiveProfile();
  const normalizedKey = String(key || "").replace(/^twinmap-/, "");
  return profile
    ? `twinmap-profile:${profile.id}:${normalizedKey}`
    : `twinmap-${normalizedKey}`;
}

function getGoogleClientId() {
  const config = window.TWINMAP_CONFIG || {};
  return config.googleClientId || config.GOOGLE_CLIENT_ID || "";
}

let googleInitPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleInitPromise) return googleInitPromise;

  googleInitPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_GIS_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("google-script")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google-script"));
    document.head.appendChild(script);
  });

  return googleInitPromise;
}

function initGoogleSignIn(options = {}) {
  const container = options.container || document.getElementById("google-signin-container");
  const demoButton = options.demoButton || document.getElementById("google-demo-btn");
  const hintEl = options.hintEl || document.getElementById("google-config-hint");
  const onSuccess = typeof options.onSuccess === "function" ? options.onSuccess : null;
  const onError = typeof options.onError === "function" ? options.onError : null;

  if (!container) return Promise.resolve({ mode: "missing-container" });

  const clientId = getGoogleClientId();

  const handleResult = (result) => {
    if (result.ok) {
      onSuccess?.(result);
    } else {
      onError?.(result.error || "Error al iniciar sesión con Google.");
    }
  };

  if (!clientId) {
    container.innerHTML = "";
    if (demoButton) {
      demoButton.hidden = false;
      demoButton.onclick = () => handleResult(loginGoogleDemo());
    }
    if (hintEl) {
      hintEl.textContent =
        "Google OAuth no configurado. Usa el botón demo o añade googleClientId en frontend/src/js/config.js.";
    }
    return Promise.resolve({ mode: "demo" });
  }

  if (demoButton) demoButton.hidden = true;
  if (hintEl) {
    hintEl.textContent = "Inicia sesión con tu cuenta de Google.";
  }

  return loadGoogleScript()
    .then(() => {
      container.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => handleResult(loginGoogleCredential(response.credential)),
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        ux_mode: "popup",
        locale: "es",
      });

      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.min(container.offsetWidth || 320, 400),
        locale: "es",
      });

      return { mode: "google" };
    })
    .catch(() => {
      container.innerHTML = "";
      if (demoButton) {
        demoButton.hidden = false;
        demoButton.onclick = () => handleResult(loginGoogleDemo());
      }
      if (hintEl) {
        hintEl.textContent = "No se pudo cargar Google Sign-In. Usa el botón demo o revisa tu conexión.";
      }
      return { mode: "demo-fallback" };
    });
}

window.TwinmapAuth = {
  getProfile: getActiveProfile,
  getProfiles: loadProfiles,
  getProfileStorageKey,
  hasProfile: () => Boolean(getActiveProfile()),
  login: loginProfile,
  loginLocal,
  loginGoogleCredential,
  loginGoogleDemo,
  logout: logoutProfile,
  initGoogleSignIn,
  getGoogleClientId,
  hashPassword,
};
