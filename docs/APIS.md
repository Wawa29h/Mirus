# APIs e integraciones

| Servicio | Uso en TwinMap | Estado | Variable local |
| --- | --- | --- | --- |
| Mapbox Maps / Directions | mapa base, capas y rutas | conectado | `MAPBOX_ACCESS_TOKEN` |
| n8n | orquestación de rutas Flash, Vibes y Zen | configurado; requiere webhook activo | `N8N_ROUTE_WEBHOOK_URL` |
| OpenStreetMap / Overpass | puntos de interés turísticos | conectado por scripts y caché | no requiere llave |
| geoBoundaries | límites administrativos y máscara de El Salvador | conectado por scripts y caché | no requiere llave |
| eBird API 2.0 | avistamientos recientes de aves y capa de biodiversidad | conectado y validado | `EBIRD_API_KEY` |
| GBIF | registros de biodiversidad históricos | conectado por script y caché | no requiere llave |
| SerpAPI Google Maps | señal de popularidad / afluencia comercial | requiere llave válida | `SERPAPI_KEY` |
| OpenWeather | clima para capas y predicción | requiere llave válida | `OPENWEATHER_API_KEY` |
| TomTom | tráfico, rutas con tráfico y búsqueda de lugares | requiere llave válida | `TOMTOM_API_KEY` |
| OpenRouter | explicación IA opcional de recomendaciones | llave validada; no es el motor de predicción | `OPENROUTER_API_KEY` |

## Datos abiertos adicionales

- **OBIS / OBIS-SEAMAP:** especies marinas, ballenas y tortugas; útil para una futura capa oceánica.
- **Movebank:** estudios con rastreadores; útil para rutas reales de especies migratorias cuando exista un estudio público.
- **Copernicus / Sentinel Hub:** imágenes y cobertura del suelo; requiere registro y credenciales OAuth para Sentinel Hub.
- **Global Forest Watch:** cambios de cobertura forestal; requiere configurar una llave para producción.

## Predicción de aves actual

La capa eBird convierte observaciones recientes en una puntuación de reavistamiento. Considera fecha, cantidad reportada y validación. Es una probabilidad explicable, no una ruta GPS de migración.

Para una predicción más robusta se deben combinar: historial eBird por especie, pronóstico meteorológico válido, hábitat/cobertura del suelo y, si existe, datos de rastreadores Movebank.

