const TWINMAP_PROFILES_KEY = "twinmap-profiles";
const TWINMAP_ACTIVE_PROFILE_KEY = "twinmap-active-profile";

function normalizeProfileName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function makeProfileId(name) {
  return normalizeProfileName(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(TWINMAP_PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
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
      createdAt: new Date().toISOString(),
    };
    profiles.push(profile);
    saveProfiles(profiles);
  }

  return setActiveProfile(profile);
}

function logoutProfile() {
  localStorage.removeItem(TWINMAP_ACTIVE_PROFILE_KEY);
  window.dispatchEvent(new CustomEvent("twinmap-auth-change", { detail: { profile: null } }));
}

function getProfileStorageKey(key) {
  const profile = getActiveProfile();
  return profile ? `twinmap-profile:${profile.id}:${key}` : key;
}

window.TwinmapAuth = {
  getProfile: getActiveProfile,
  getProfiles: loadProfiles,
  getProfileStorageKey,
  hasProfile: () => Boolean(getActiveProfile()),
  login: loginProfile,
  logout: logoutProfile,
};
