# API TwinMap — integración frontend

Base URL por defecto: `http://localhost:3001` (configurable en `frontend/src/js/config.js` copiado desde `config.example.js`).

## Endpoints

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/health` | Estado del servidor |
| GET | `/data/weather.json` | Pronóstico cacheado (Open-Meteo) |
| GET | `/data/pois.geojson` | Catálogo POI (OSM) |
| GET | `/api/crowds` | Afluencia / popular times (SerpAPI, caché) |
| GET | `/api/birds` | Avistamientos eBird |
| GET | `/api/birds/forecast` | Pronóstico migratorio (LLM + eBird) |
| POST | `/api/routes/calculate` | Ruta inteligente (n8n → fallback Mapbox) |
| POST | `/api/assistant/route` | Recomendación de paradas (OpenRouter + POIs) |

Variables: ver `.env.example` en la raíz del repo.

## Cliente frontend

- `frontend/src/js/api.js` expone `window.TwinmapApi`.
- Degradación: si la API falla, el UI sigue con mocks locales.

## Módulos conectados

- `mapa-personalizado.js`: POIs suplementarios + resumen IA vía asistente.
- `map-place-popup.js`: pronóstico desde `/data/weather.json`.
- `route-itinerary.js`: hint de ruta en carretera entre primera y última parada.

## Levantar el proyecto

```powershell
cd c:\Users\miche\Desktop\Twinmap\twinmap
Copy-Item .env.example .env   # editar llaves
npm install
npm start                      # API en :3001

cd frontend
python -m http.server 8080     # UI en http://localhost:8080
```

Documentación ampliada del backend: `docs/APIS.md`.
