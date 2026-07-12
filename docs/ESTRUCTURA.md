# Estructura del proyecto

```text
twinmap/
├── index.html                 # Frontend y capas del mapa
├── config.js                  # Configuración local, ignorada por Git
├── server.js                  # Backend Express (puerto 3001)
├── controllers/               # Lógica de rutas, afluencia y aves
├── routes/                    # Endpoints Express
├── lib/                       # Utilidades de datos externos
├── scripts/                   # Actualización de datos/cache
├── data/                      # GeoJSON y JSON que consume el mapa
├── docs/                      # Esta documentación
├── .env                       # Llaves locales, ignorado por Git
└── .env.example               # Plantilla de variables de entorno
```

## Endpoints locales

| Endpoint | Descripción |
| --- | --- |
| `GET /health` | estado del backend |
| `POST /api/routes/calculate` | rutas inteligentes mediante n8n con fallback Mapbox |
| `GET /api/crowds` | señal de afluencia por zonas |
| `GET /api/birds` | observaciones recientes de eBird y puntuación de reavistamiento |

## Ejecución local

```powershell
npm install
npm run dev
```

El mapa está disponible desde el servidor estático en `http://localhost:3000/`; el backend usa `http://localhost:3001/`.

