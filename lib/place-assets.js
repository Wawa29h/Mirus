const FILE_BY_KEY = {
  playa: "playa.png",
  volcan: "volcan.png",
  cascada: "cascada.png",
  parque: "parque.png",
  montana: "montana.png",
  comida: "comida.png",
  hospedaje: "alojamiento.png",
  historico: "iglesia.png",
  cultura: "iglesia.png",
  turismo: "eventos.png",
  naturaleza: "montana.png",
  mirador: "montana.png",
  sendero: "parque.png",
  eventos: "eventos.png",
  otro: "parque.png",
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function imagePathForCategory(category, kind) {
  const k = normalize(kind);
  if (k.includes("surf")) return "/frontend/assets/surf.png";
  if (k.includes("volcan")) return "/frontend/assets/volcan.png";
  if (k.includes("cascada") || k.includes("waterfall")) return "/frontend/assets/cascada.png";
  if (k.includes("restaurant") || k.includes("cafe") || k.includes("food") || k.includes("bar")) {
    return "/frontend/assets/comida.png";
  }
  if (k.includes("hotel") || k.includes("hostel") || k.includes("guest")) return "/frontend/assets/alojamiento.png";
  if (k.includes("church") || k.includes("museum") || k.includes("monument")) return "/frontend/assets/iglesia.png";
  if (k.includes("beach") || k.includes("playa")) return "/frontend/assets/playa.png";
  if (k.includes("park") || k.includes("parque") || k.includes("trail") || k.includes("sendero")) {
    return "/frontend/assets/parque.png";
  }
  const key = normalize(category);
  const file = FILE_BY_KEY[key] || "parque.png";
  return `/frontend/assets/${file}`;
}

export function weatherLabel(code) {
  const c = Number(code);
  if (c === 0) return "Despejado";
  if (c <= 3) return "Parcialmente nublado";
  if (c <= 48) return "Niebla";
  if (c <= 67) return "Lluvia";
  if (c <= 77) return "Nieve o granizo";
  if (c <= 82) return "Chubascos";
  if (c <= 99) return "Tormenta";
  return "Variable";
}
