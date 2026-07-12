# Fuentes de datos de Mirus

## Sin API key (ya agregadas)

```bash
# Clima y pronóstico de cualquier destino
node scripts/fetch-weather.mjs --lat 40.4168 --lng -3.7038 --name "Madrid"

# Observaciones de biodiversidad de GBIF alrededor del destino
node scripts/fetch-biodiversity.mjs --lat 40.4168 --lng -3.7038 --radius 30 --name "Madrid"

# Interés de búsqueda (instalar Python y pytrends antes)
pip install -r requirements.txt
python scripts/fetch-trends.py --term "turismo Madrid" --geo ES
```

Generan `data/weather.json`, `data/biodiversity.geojson` y `data/trends.json`. Los scripts no
guardan credenciales y están parametrizados para cualquier ciudad o coordenada.

## Con API key o token

- Foursquare Places: popularidad, horas pico y detalles de POIs.
- Eventbrite: eventos por ciudad y fecha.
- Reddit: menciones y sentimiento.
- Ticketmaster Discovery: eventos de gran escala.
- Google Places: reseñas y datos comerciales complementarios.
- StormGlass: mareas y condiciones marítimas.
- eBird: avistamientos de aves.
- OpenRouter: explicaciones conversacionales.
