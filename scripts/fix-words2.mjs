// Segundo pase: palabras con "?" (acento perdido) que faltaron. Solo .html y .css.
// NO toca parámetros de URL (css?v, js?v, forecast?refresh) porque no están en la lista.
import { readFileSync, writeFileSync } from "node:fs";

const WORDS = {
  "vegetaci?n":"vegetación","tur?stico":"turístico","Tur?stico":"Turístico","tur?sticos":"turísticos","tur?stica":"turística","tur?sticas":"turísticas",
  "seg?n":"según","Seg?n":"Según","Sat?lite":"Satélite","sat?lite":"satélite","tr?fico":"tráfico","Tr?fico":"Tráfico",
  "inter?s":"interés","Inter?s":"Interés","gastronom?a":"gastronomía","Gastronom?a":"Gastronomía",
  "ilustraci?n":"ilustración","Ilustraci?n":"Ilustración","salvadore?o":"salvadoreño","salvadore?a":"salvadoreña",
  "soluci?n":"solución","Soluci?n":"Solución","m?dulos":"módulos","m?dulo":"módulo","M?dulos":"Módulos",
  "Contrase?a":"Contraseña","contrase?a":"contraseña","M?nimo":"Mínimo","m?nimo":"mínimo",
  "Recomendaci?n":"Recomendación","recomendaci?n":"recomendación","Recomendaciones":"Recomendaciones",
  "A?ade":"Añade","a?ade":"añade","A?adir":"Añadir","a?adir":"añadir","a?adido":"añadido",
  "bot?n":"botón","Bot?n":"Botón","arqueol?gicos":"arqueológicos","arqueol?gico":"arqueológico",
  "exploraci?n":"exploración","Exploraci?n":"Exploración","regeneraci?n":"regeneración",
  "expedici?n":"expedición","Expedici?n":"Expedición","Pron?stico":"Pronóstico","pron?stico":"pronóstico",
  "Ma?ana":"Mañana","ma?ana":"mañana","m?gicos":"mágicos","M?gicos":"Mágicos","m?gico":"mágico","m?gica":"mágica","m?gicas":"mágicas",
  "Monta?as":"Montañas","monta?as":"montañas","Monta?a":"Montaña","monta?a":"montaña",
};

let total = 0;
for (const file of ["frontend/index.html", "index.html", "frontend/src/css/styles.css"]) {
  let s = readFileSync(file, "utf8");
  const before = s;
  for (const [bad, good] of Object.entries(WORDS)) {
    if (s.includes(bad)) { total += s.split(bad).length - 1; s = s.split(bad).join(good); }
  }
  if (s !== before) { writeFileSync(file, s); console.log("  ✓", file); }
}
console.log(`\n✓ ${total} palabras corregidas`);
