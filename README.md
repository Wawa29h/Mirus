# Mirus · Gemelo digital turístico

Mapa base (core) del gemelo digital turístico de **Barra de Santiago, El Salvador**.
Mapbox GL JS + capas activables: edificios/terreno 3D, POIs en vivo (OpenStreetMap),
heatmap de afluencia simulada y zonas de biodiversidad.

## 1. Configurar el token

1. Crea cuenta gratis en https://account.mapbox.com y copia tu **Default public token** (`pk...`).
2. Pega el token en `config.js` (ya existe; no se sube a git).

## 2. Correr en local

Necesita un servidor (no abrir el `.html` directo, o `fetch` de Overpass falla por CORS/file://):

```bash
npx serve .        # o:  python -m http.server 8000
```

Abre http://localhost:3000 (o el puerto que indique).

## 3. Desplegar (elige uno)

### Vercel (frontend estático — recomendado)

Este repo tiene **frontend estático** (`frontend/`, `index.html`) y **API Express** (`server.js`) en la misma raíz. En Vercel solo se despliega el sitio estático; el backend va aparte (Railway, Render, etc.).

**Panel de Vercel → Project Settings → Build & Development:**

| Campo | Valor |
|-------|-------|
| Framework Preset | **Other** (no Express) |
| Build Command | `node scripts/netlify-config.mjs` |
| Output Directory | `.` |
| Install Command | *(vacío)* |

`vercel.json` ya fuerza `"framework": null` para evitar que Vercel detecte Express por `server.js` / `"start": "node server.js"`.

**Variables de entorno** (Settings → Environment Variables):

- `MAPBOX_TOKEN` o `MAPBOX_ACCESS_TOKEN` — token público `pk...`
- `API_BASE` — URL del backend Express desplegado aparte (ej. `https://mirus-api.onrender.com`)

```bash
git push origin main
# En Vercel: Deployments → Redeploy (o espera el deploy automático del push)
```

Raíz `/` sirve `frontend/index.html` (app Mirus). Mapa standalone: `/index.html` o rewrite `/map`.

### Otras opciones

- **Netlify**: arrastra la carpeta a https://app.netlify.com/drop (usa `netlify.toml`)
- **GitHub Pages**: sube el repo → Settings → Pages → deploy desde `main` / raíz

> Nota de seguridad: el token público de Mapbox queda visible en el frontend (es normal).
> En producción, restríngelo por **URL (referrer)** desde el dashboard de Mapbox para que
> solo funcione en tu dominio de deploy.

## Estructura

```
index.html          Mapa + panel de capas (todo el frontend)
config.js           Tu token + centro/zoom (NO se sube a git)
config.example.js   Plantilla del config
```

## Próximos pasos del gemelo (roadmap)

- [ ] Dashboard "signos vitales" (clima Open-Meteo, mareas StormGlass, afluencia)
- [ ] Asistente conversacional (OpenRouter) que interpreta las capas
- [ ] Simulador de rutas personalizadas (n8n: Overpass + Open-Meteo + scoring por pesos)
- [ ] Pipeline de predicción de afluencia (Firecrawl noticias + LLM razonando)
