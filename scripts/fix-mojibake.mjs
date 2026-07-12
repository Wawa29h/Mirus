// Arregla la codificación rota en todos los archivos de texto del proyecto.
// Pass 1: mojibake recuperable (é→é, ·→·, etc.) en TODOS los archivos.
// Pass 2: acentos perdidos como "?" (bit?cora→bitácora) SOLO en .html (evita ternarios de JS).
// Correr: node scripts/fix-mojibake.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

// --- Pass 1: secuencias mojibake → carácter correcto (targeted, no corrompe UTF-8 bueno) ---
const MOJI = {
  "á":"á","é":"é","í":"í","ó":"ó","ú":"ú","ñ":"ñ","ü":"ü",
  "Á":"Á","É":"É","Í":"Í","Ó":"Ó","Ú":"Ú","Ñ":"Ñ",
  "·":"·","¡":"¡","¿":"¿","º":"º","ª":"ª","°":"°",
  "“":"“","”":"”","’":"’","‘":"‘",
  "–":"–","—":"—","…":"…","€":"€"," ":" ",
};

// --- Pass 2: palabras UI comunes con "?" (acento perdido) → forma correcta ---
const WORDS = {
  "bit?cora":"bitácora","Bit?cora":"Bitácora","BIT?CORA":"BITÁCORA",
  "N?meros":"Números","n?meros":"números","N?mero":"Número","n?mero":"número",
  "Configuraci?n":"Configuración","configuraci?n":"configuración",
  "Planeaci?n":"Planeación","PLANEACI?N":"PLANEACIÓN","planeaci?n":"planeación",
  "Desaf?os":"Desafíos","desaf?os":"desafíos","Desaf?o":"Desafío",
  "m?tricas":"métricas","M?tricas":"Métricas","m?trica":"métrica",
  "Informaci?n":"Información","informaci?n":"información",
  "Navegaci?n":"Navegación","navegaci?n":"navegación",
  "Ubicaci?n":"Ubicación","ubicaci?n":"ubicación",
  "descripci?n":"descripción","Descripci?n":"Descripción",
  "categor?a":"categoría","Categor?a":"Categoría","categor?as":"categorías",
  "d?a":"día","D?a":"Día","d?as":"días",
  "as?":"así","aqu?":"aquí","a?n":"aún","A?n":"Aún","m?s":"más","M?s":"Más",
  "p?gina":"página","P?gina":"Página","r?pida":"rápida","R?pida":"Rápida","r?pido":"rápido",
  "b?squeda":"búsqueda","B?squeda":"Búsqueda","c?mo":"cómo","C?mo":"Cómo",
  "qu?":"qué","Qu?":"Qué","tambi?n":"también","Tambi?n":"También",
  "men?":"menú","Men?":"Menú","?ltimo":"último","?nico":"único",
  "geograf?a":"geografía","recorri?":"recorrió","aparecer?":"aparecerá",
  "El?geme":"Elígeme","Ll?vame":"Llévame","atr?s":"atrás","Atr?s":"Atrás",
  "gu?a":"guía","Gu?a":"Guía","tel?fono":"teléfono","Tel?fono":"Teléfono",
  "cr?ditos":"créditos","est?":"está","Est?":"Está","aplicaci?n":"aplicación",
  "cuestionar?o":"cuestionario","sesi?n":"sesión","Sesi?n":"Sesión",
  "?xito":"éxito","cl?sico":"clásico","hist?rico":"histórico","Hist?rico":"Histórico",
  "monta?a":"montaña","Monta?a":"Montaña","peque?o":"pequeño","peque?a":"pequeña",
  "compa??a":"compañía","dise?o":"diseño","Dise?o":"Diseño","a?o":"año","a?os":"años",
};

function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if ([".js",".mjs",".html",".css",".json",".md"].includes(extname(name))) out.push(p);
  }
  return out;
}

let filesChanged = 0, mojiFixed = 0, wordFixed = 0;
for (const file of walk(".")) {
  let s = readFileSync(file, "utf8");
  const before = s;
  // Pass 1: mojibake (todos los archivos)
  for (const [bad, good] of Object.entries(MOJI)) {
    if (s.includes(bad)) { mojiFixed += s.split(bad).length - 1; s = s.split(bad).join(good); }
  }
  // Pass 2: palabras con "?" solo en HTML (los .js usan ? como ternario)
  if (extname(file) === ".html") {
    for (const [bad, good] of Object.entries(WORDS)) {
      if (s.includes(bad)) { wordFixed += s.split(bad).length - 1; s = s.split(bad).join(good); }
    }
  }
  if (s !== before) { writeFileSync(file, s); filesChanged++; console.log("  ✓", basename(file)); }
}
console.log(`\n✓ ${filesChanged} archivos · ${mojiFixed} mojibake · ${wordFixed} palabras con "?" corregidas`);
