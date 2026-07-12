# Mirus · Gemelo digital turístico — Documentación del proyecto

> Contexto para Claude Code y para el equipo. Estado al 2026-07-12.

## Qué es

Prototipo de **gemelo digital turístico** para el reto **TWINMAP** de un hackathon.
Caso piloto: **Barra de Santiago, El Salvador** (humedal RAMSAR, manglar, ecoturismo
comunitario, aves migratorias y tortugas). Centro base: `lat 13.74, lng -90.05`.

Enfoque **"low twin"**: no hay sensores IoT ni ML entrenado. Se combinan pocas fuentes de
datos abiertas y se simulan datos con reglas realistas cuando no hay API real. El **mapa es
el core obligatorio**; encima se agregan capas de diferenciación (rutas, dashboard, etc.).

## Arquitectura (3 piezas + app shell)

```
┌──────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  frontend/           │     │  BACKEND (Express)    │     │  n8n (orquestación)  │
│  App Mirus (login,   │     │  server.js :3001      │     │  webhook digital twin│
│  bitácora, favoritos)│────▶│  /api/*               │────▶│  + fallback Mapbox   │
│  iframe → index.html │     │  /data (estático)     │     │                      │
└──────────────────────┘     └──────────────────────┘     └─────────────────────┘
         │ embed
         ▼
┌──────────────────────┐
│  index.html (raíz)   │  Mapa Mapbox completo: capas, sidebar, rutas, asistente
└──────────────────────┘
```

- **App shell** (`frontend/index.html`): landing, login por perfil, onboarding, bitácora,
  favoritos, emergencia, mapa personalizado. El mapa real vive en un **iframe** que carga
  `/index.html?embed=1&ui=frontend&tourism=1&heat=1`.
- **Mapa** (`index.html` en raíz): Mapbox GL + todas las capas + sidebar de lugar (ChatGPT,
  Waze/inDrive, noticias). También funciona standalone en `http://localhost:3000/`.
- **Backend** (`server.js` + `routes/` + `controllers/`): API Express. Rutas inteligentes
  vía n8n con fallback Mapbox Directions; proxies de crowds, birds, news, traffic, assistant.
- **Libs compartidas** (`lib/`): `place-storage.js`, `place-travel-panel.js`, `profile-sync.js`,
  `category-images.js`, `destinations.js`, `popular-times.js` (Node, para scripts/backend).
- **Scripts** (`scripts/`): cachean datos en `data/`. Se corren a mano, no en producción.

**Estado de integración (jul 2026):** el frontend **sí está conectado** al mapa vía iframe +
`postMessage`. Favoritos/bitácora del mapa sincronizan con la app por `TwinmapPlaceStorage`
(perfil en `localStorage`). El backend alimenta crowds, aves, noticias, asistente y rutas.

## Stack

| Área | Tecnología | Key / env |
|---|---|---|
| Mapa | Mapbox GL JS **v3.17.0** (satélite + terreno/edificios 3D) | Token en `config.js` |
| Buscador | Plugin `mapbox-gl-geocoder` v5.0.3 | mismo token |
| Backend | **Express 5** + axios + dotenv (Node, ESM) | `.env` |
| Rutas | n8n webhook → fallback **Mapbox Directions API** | `N8N_ROUTE_WEBHOOK_URL`, `MAPBOX_ACCESS_TOKEN` |
| Crowds / heatmap | SerpAPI Popular Times → fallback cache + pesos MITUR | `SERPAPI_KEY` (opcional) |
| Noticias | Proxy **NewsData.io** | `NEWSDATA_API_KEY` (opcional, hay fallback) |
| Asistente | OpenRouter (place-info, rutas) | `OPENROUTER_API_KEY` (opcional) |
| Tráfico | Mapbox Traffic vía proxy backend | `MAPBOX_ACCESS_TOKEN` |
| Turismo oficial | Catálogo **MITUR** (104 destinos) | sin key (cache local) |
| POIs | Overpass API (OpenStreetMap) | sin key |
| Límites país/deptos | geoBoundaries API | sin key |
| Biodiversidad | **GBIF** API | sin key |
| Clima | **Open-Meteo** API | sin key |
| Tendencias | Google Trends vía **pytrends** (Python, no oficial) | sin key |
| Hosting | Frontend estático + backend Node | — |

## Flujo de carpetas

```
twinmap/
│  ── APP SHELL (frontend/) ──
├── frontend/
│   ├── index.html              ← App Mirus: login, navegación, iframe del mapa
│   └── src/js/                 ← auth, bitácora, favoritos, mapa-personalizado, api.js
│
│  ── MAPA (raíz) ──
├── index.html                  ← Mapa Mapbox completo (~4300 líneas) + embed mode
├── config.js                   ← Token Mapbox + API_BASE. ⚠️ NO se sube (.gitignore)
├── config.example.js
├── lib/                        ← place-storage, place-travel-panel, profile-sync, etc.
│
│  ── BACKEND (Express API) ──
├── server.js                   ← Puerto 3001: /api/* + /data estático
├── routes/
│   ├── route.js                ← /calculate, /smart, /destinations
│   ├── crowds.js, birds.js, news.js, assistant.js, traffic.js, config.js
├── controllers/
│
│  ── DATOS (scripts → cache) ──
├── scripts/
│   ├── fetch-pois.mjs          → data/pois.geojson
│   ├── fetch-tourism.mjs       → data/tourism-official.geojson (104 MITUR)
│   ├── fetch-biodiversity.mjs  → data/biodiversity.geojson (GBIF)
│   ├── fetch-weather.mjs       → data/weather.json
│   ├── fetch-popular-times.mjs → data/crowds.geojson
│   └── … (departments, mask, nature, parking, trends)
├── data/
│   ├── tourism-official.geojson  ← 104 destinos MITUR
│   ├── crowds.geojson            ← heatmap afluencia
│   ├── biodiversity.geojson        ← GBIF
│   ├── weather.json, birds.geojson, nature-curated.geojson, …
│
│  ── DOCS ──
├── CLAUDE.md, README.md, .cursorrules
```

## Cómo correr

**Todo junto (UX actual):**
```bash
# Terminal 1 — sitio estático (raíz + frontend/)
npx serve -l 3000 .
# → App: http://localhost:3000/frontend/
# → Mapa standalone: http://localhost:3000/

# Terminal 2 — API (crowds, news, assistant, rutas)
npm install
cp .env.example .env   # MAPBOX_ACCESS_TOKEN, keys opcionales
npm run dev            # http://localhost:3001
```

**Solo mapa** (sin app shell):
```bash
npx serve -l 3000 .
# config.js con MAPBOX_TOKEN + API_BASE=http://localhost:3001
```

Abrir `http://localhost:3000/frontend/` → login → Modo ruta → **Explorar mapa**.
El iframe carga el mapa con turismo MITUR + heatmap activos por defecto.

**Refrescar datos** (opcional):
```bash
node scripts/fetch-pois.mjs
node scripts/fetch-biodiversity.mjs --lat 13.74 --lng -90.05 --radius 25
node scripts/fetch-weather.mjs --lat 13.74 --lng -90.05
node scripts/fetch-tourism.mjs   # requiere data/tourism-export.json o --url
pip install -r requirements.txt && python scripts/fetch-trends.py --term "turismo El Salvador" --geo SV
```

## API del backend

| Ruta | Descripción |
|------|-------------|
| `POST /api/routes/calculate` | Ruta simple: n8n → fallback Mapbox Directions |
| `GET /api/routes/destinations` | Destinos por categoría + perfil (POI+nature+MITUR) |
| `POST /api/routes/smart` | Rutas personalizadas con scoring |
| `GET /api/crowds` | Afluencia SerpAPI (+ cache `data/crowds.geojson`) |
| `GET /api/birds` | Avistamientos eBird (+ cache) |
| `GET /api/birds/forecast` | Pronóstico migratorio |
| `GET /api/news?q=...` | Proxy NewsData.io (noticias en sidebar y emergencias) |
| `POST /api/assistant/place-info` | Descripción + clima de un lugar (OpenRouter) |
| `POST /api/assistant/route` | Ruta conversacional por mensaje |
| `GET /api/traffic/status` + tiles | Tráfico Mapbox en vivo |
| `GET /api/config` | Token Mapbox público (si no hay config.js) |
| `GET /data/*` | GeoJSON/JSON cacheados |
| `GET /health` | `{ ok: true }` |

## Funcionalidades del mapa (`index.html`)

Dentro de `boot()` → `map.on("style.load")`:

1. **Mapa base 3D** — `satellite-streets-v12`, terreno DEM, niebla, pitch 60°. Calles más finas (`thinBaseRoads`).
2. **Edificios 3D** — `fill-extrusion` (capa `3d-buildings`).
3. **POIs con símbolos** — `data/pois.geojson`, 10 categorías en embed (chips izquierda).
4. **MITUR** — `data/tourism-official.geojson` (104 destinos), símbolos + heatmap con pesos turísticos.
5. **Heatmap afluencia** — SerpAPI + estimación MITUR; toggle `lyr-heat`.
6. **Naturaleza** — `data/nature-curated.geojson` con iconos por categoría.
7. **Biodiversidad** — eBird en vivo/cache + `data/biodiversity.geojson` (GBIF).
8. **Departamentos / Modo isla** — choropleth + máscara océano.
9. **Sidebar de lugar** (embed frontend) — ChatGPT, clima, Waze/inDrive, noticias vía `/api/news`.
10. **Favoritos / visitados** — `TwinmapPlaceStorage` con scope por perfil; `postMessage` al parent.
11. **Mapa personalizado** — iframe con filtros por zona/categoría del quiz (`shell=personalizado`).
12. **Dashboard clima** — `data/weather.json` (panel vitals, oculto en embed).

**Modo embed** (`?embed=1&ui=frontend`): chips categoría (izq), capas (der), sidebar lateral.
Parámetros `tourism=1&heat=1` activan MITUR y heatmap al cargar.

Hooks de depuración: `window._twinmap`, `window._geocoder`.

## Gotchas aprendidos

- **Estilo Mapbox "Standard"/"standard-satellite" NO carga** (imports se cuelgan). Usar
  `satellite-streets-v12` + edificios 3D manuales con `fill-extrusion`.
- **Overpass da HTTP 406** con el User-Agent default de curl/node. Mandar `User-Agent` propio.
- **Máscara isla no pintaba** porque el contorno tiene 11168 puntos y earcut falla. Simplificar
  con Douglas-Peucker a ~313 puntos (`fetch-mask.mjs`).
- **El Browser pane de Claude no compositea WebGL de Mapbox**: screenshots se cuelgan,
  `queryRenderedFeatures` da 0. Verificar por estado JS, no por captura.

## Roadmap (lo que falta)

- [ ] **Montar flujo n8n** completo (3 rutas + explicación LLM vía OpenRouter).
- [ ] **Dashboard signos vitales** visible en embed (clima ya en cache; marea StormGlass pendiente).
- [ ] **Trends** (`data/trends.json`) para predicción de afluencia.
- [ ] **Deploy**: frontend estático (Vercel) + backend Node (Railway/Render). Restringir token Mapbox por URL.
- [ ] **Actualizar** `frontend/README.md` (sigue describiendo el mockup antiguo).
```

## APIs: cuáles necesitan key

- **Sin key:** Mapbox (1 token cubre mapa+geocoder+directions), Overpass, geoBoundaries,
  Open-Meteo, GBIF, Google Trends (vía pytrends, no oficial).
- **Key gratis pendiente:** StormGlass (marea), eBird (aves), OpenRouter (LLM para explicaciones).
- **Solo pitch (no son APIs REST):** DIGESTYC (censo), MITUR (turismo) — "fuente de verdad futura".
