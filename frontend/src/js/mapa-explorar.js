/**
 * Mapa Mapbox integrado para "Explorar mapa" (modo ruta).
 * Carga POIs, multitudes y aves desde el backend Express.
 */
(function initExplorarMapa(global) {
  const DEFAULT_API_BASE = (
    global.TwinmapApi?.API_BASE_URL ||
    global.TWINMAP_CONFIG?.apiBaseUrl ||
    "http://localhost:3001"
  ).replace(/\/$/, "");

  let API_BASE = DEFAULT_API_BASE;
  let resolvedConfig = null;
  let configPromise = null;

  async function resolveConfig() {
    if (configPromise) return configPromise;

    configPromise = (async () => {
      const local = global.TWINMAP_CONFIG || {};
      const apiBase = (local.apiBaseUrl || DEFAULT_API_BASE).replace(/\/$/, "");
      const localToken = local.MAPBOX_TOKEN;

      if (localToken && localToken.startsWith("pk.")) {
        resolvedConfig = { ...local, apiBaseUrl: apiBase };
        API_BASE = apiBase;
        return resolvedConfig;
      }

      try {
        const response = await fetch(`${apiBase}/api/config`);
        if (response.ok) {
          const remote = await response.json();
          const remoteToken = remote.mapboxToken;
          if (remoteToken && remoteToken.startsWith("pk.")) {
            resolvedConfig = {
              ...local,
              MAPBOX_TOKEN: remoteToken,
              apiBaseUrl: (remote.apiBaseUrl || apiBase).replace(/\/$/, ""),
              CENTER: local.CENTER || [-89.2, 13.7],
              ZOOM: local.ZOOM ?? 8,
            };
            global.TWINMAP_CONFIG = resolvedConfig;
            API_BASE = resolvedConfig.apiBaseUrl;
            return resolvedConfig;
          }
        }
      } catch {
        // Backend no disponible; se mostrará aviso de token.
      }

      resolvedConfig = { ...local, apiBaseUrl: apiBase };
      API_BASE = apiBase;
      return resolvedConfig;
    })();

    return configPromise;
  }

  const CAT_COLORS = {
    comida: "#ffbf69",
    hospedaje: "#8ecae6",
    playa: "#48cae4",
    historico: "#e07a5f",
    turismo: "#06d6a0",
    parque: "#90be6d",
    otro: "#adb5bd",
  };

  const CAT_LABELS = {
    comida: "Gastronomía",
    hospedaje: "Hospedaje",
    playa: "Playa",
    historico: "Histórico",
    turismo: "Turismo",
    parque: "Parque",
    otro: "Lugar",
  };

  const POI_LAYERS = ["clusters", "cluster-count", "pois-layer"];
  const DEPT_LAYERS = ["dept-fill", "dept-line", "dept-label"];
  const TRAFFIC_LAYERS = ["traffic-live"];
  const NATURE_LAYERS = ["nature-halo", "nature-points", "nature-labels"];
  const CROWD_LAYERS = ["crowds-heat", "crowds-points"];
  const BIO_LAYERS = ["bio-heat", "bio-layer"];

  const containerEl = document.getElementById("explorar-map-container");
  const statusEl = document.getElementById("explorar-map-status");
  const tokenWarnEl = document.getElementById("explorar-map-token-warn");
  const detailTitleEl = document.getElementById("explorar-detail-title");
  const detailTextEl = document.getElementById("explorar-detail-text");
  const detailStatusEl = document.getElementById("explorar-detail-status");
  const recommendationsEl = document.getElementById("explorar-recommendations");
  const geocoderMountEl = document.getElementById("explorar-geocoder");
  const locationBtn = document.getElementById("explorar-my-location");
  const layerPanelEl = document.querySelector(".map-filter-panel--layers");

  let map = null;
  let geocoder = null;
  let myLocationMarker = null;
  let initialized = false;
  let bioMinT = 0;
  let bioMaxDay = 1;

  function setStatus(html) {
    if (statusEl) statusEl.innerHTML = html;
    if (detailStatusEl) detailStatusEl.innerHTML = html;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }

  function dataUrl(path) {
    return `${API_BASE}${path}`;
  }

  function poiFeatureToPlace(feature, index) {
    const props = feature.properties || {};
    const name = props.name && props.name !== "Sin nombre" ? props.name : null;
    if (!name) return null;
    const [lng, lat] = feature.geometry?.coordinates || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const cat = props.cat || "otro";
    const kind = props.kind ? ` (${props.kind})` : "";
    return {
      id: `poi-${index}-${name}`.toLowerCase().replace(/\s+/g, "-").slice(0, 80),
      name,
      category: CAT_LABELS[cat] || cat,
      location: "El Salvador",
      description: props.kind
        ? `Punto de interés${kind} en OpenStreetMap.`
        : "Punto de interés turístico en El Salvador.",
      weather: "26°C · Consulta en vivo",
      lat: String(lat),
      lng: String(lng),
      newsUrl: `https://news.google.com/search?q=${encodeURIComponent(`${name} El Salvador`)}`,
    };
  }

  function openPlaceFromFeature(feature, index) {
    const place = poiFeatureToPlace(feature, index);
    if (!place) return;
    if (detailTitleEl) detailTitleEl.textContent = place.name;
    if (detailTextEl) {
      detailTextEl.textContent = `${place.category} · ${place.description}`;
    }
    global.TwinmapPlacePopup?.openFromPlace?.(place);
  }

  function setLayerVisibility(layerIds, visible) {
    if (!map) return;
    layerIds.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    });
  }

  function toggle3D(on) {
    if (map?.getLayer("3d-buildings")) {
      map.setLayoutProperty("3d-buildings", "visibility", on ? "visible" : "none");
    }
  }

  async function loadPOIs() {
    const result = await global.TwinmapApi?.getPoisGeojson?.();
    const geojson = result?.ok && result.payload?.features
      ? result.payload
      : null;

    if (!geojson) {
      setStatus("POIs: no se pudo cargar desde la API.");
      return;
    }

    const total = geojson.features.length;
    map.addSource("pois", {
      type: "geojson",
      data: geojson,
      cluster: true,
      clusterMaxZoom: 13,
      clusterRadius: 50,
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "pois",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#2ec4b6",
        "circle-opacity": 0.85,
        "circle-radius": ["step", ["get", "point_count"], 16, 50, 22, 200, 30],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0d1b2a",
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "pois",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
      },
      paint: { "text-color": "#0d1b2a" },
    });

    map.addLayer({
      id: "pois-layer",
      type: "circle",
      source: "pois",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "match",
          ["get", "cat"],
          "comida", CAT_COLORS.comida,
          "hospedaje", CAT_COLORS.hospedaje,
          "playa", CAT_COLORS.playa,
          "historico", CAT_COLORS.historico,
          "turismo", CAT_COLORS.turismo,
          "parque", CAT_COLORS.parque,
          CAT_COLORS.otro,
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#0d1b2a",
      },
    });

    map.on("click", "clusters", (e) => {
      const feature = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
      if (!feature) return;
      map.getSource("pois").getClusterExpansionZoom(feature.properties.cluster_id, (err, zoom) => {
        if (!err) map.easeTo({ center: feature.geometry.coordinates, zoom });
      });
    });

    map.on("click", "pois-layer", (e) => {
      const feature = e.features?.[0];
      if (!feature) return;
      openPlaceFromFeature(feature, e.point.x);
    });

    ["clusters", "pois-layer"].forEach((id) => {
      map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
    });

    setStatus(`Mapa listo · <strong>${total.toLocaleString()}</strong> POIs desde API`);
    renderRecommendations(geojson.features.slice(0, 6));
  }

  async function loadCrowds() {
    const empty = { type: "FeatureCollection", features: [] };
    map.addSource("crowds", { type: "geojson", data: empty });
    map.addLayer({
      id: "crowds-heat",
      type: "heatmap",
      source: "crowds",
      layout: { visibility: "none" },
      paint: {
        "heatmap-weight": ["coalesce", ["get", "busyness"], 0],
        "heatmap-intensity": 1.2,
        "heatmap-radius": 45,
        "heatmap-opacity": 0.8,
        "heatmap-color": [
          "interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.35, "#2ec4b6",
          0.65, "#ffbf69",
          1, "#ff6b6b",
        ],
      },
    });
    map.addLayer({
      id: "crowds-points",
      type: "circle",
      source: "crowds",
      layout: { visibility: "none" },
      filter: [">=", ["get", "busyness"], 0],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "busyness"], 0, 8, 50, 15, 100, 23],
        "circle-color": ["interpolate", ["linear"], ["get", "busyness"], 0, "#2ec4b6", 45, "#ffbf69", 75, "#ff6b6b"],
        "circle-opacity": 0.88,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0d1b2a",
      },
    });

    map.on("click", "crowds-points", (event) => {
      const p = event.features[0].properties;
      if (detailTitleEl) detailTitleEl.textContent = p.name;
      if (detailTextEl) {
        detailTextEl.textContent = `Afluencia estimada: ${Math.round(p.busyness)}% · ${p.info || ""}`;
      }
      new mapboxgl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(`<b>${escapeHtml(p.name)}</b><br>Intensidad: <b>${Math.round(p.busyness)}%</b><br><small>${escapeHtml(p.info || "")}</small>`)
        .addTo(map);
    });

    map.on("mouseenter", "crowds-points", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "crowds-points", () => { map.getCanvas().style.cursor = ""; });

    const sub = document.querySelector('[data-layer-sub="crowds"]');
    const result = await global.TwinmapApi?.getCrowds?.();
    const crowds = result?.ok && result.payload?.data ? result.payload.data : empty;
    map.getSource("crowds").setData(crowds);
    const valid = (crowds.features || []).filter((f) => Number.isFinite(f.properties?.busyness)).length;
    if (sub) {
      sub.textContent = valid
        ? `${valid} lugares con intensidad (API)`
        : "Sin datos de afluencia para esta zona";
    }
  }

  async function loadBirds() {
    const empty = { type: "FeatureCollection", features: [] };
    map.addSource("bio", { type: "geojson", data: empty });
    map.addLayer({
      id: "bio-heat",
      type: "heatmap",
      source: "bio",
      layout: { visibility: "none" },
      paint: {
        "heatmap-weight": ["get", "prediction_score"],
        "heatmap-radius": 35,
        "heatmap-intensity": 1,
        "heatmap-opacity": 0.72,
        "heatmap-color": [
          "interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(0,0,0,0)",
          0.35, "#48cae4",
          0.65, "#06d6a0",
          1, "#ffbf69",
        ],
      },
    });
    map.addLayer({
      id: "bio-layer",
      type: "circle",
      source: "bio",
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "prediction_score"], 0, 5, 100, 15],
        "circle-color": ["interpolate", ["linear"], ["get", "prediction_score"], 0, "#48cae4", 50, "#06d6a0", 75, "#ffbf69"],
        "circle-opacity": 0.86,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#0d1b2a",
      },
    });

    map.on("click", "bio-layer", (event) => {
      const p = event.features[0].properties;
      const quantity = p.quantity ? ` · ${p.quantity} individuos` : "";
      if (detailTitleEl) detailTitleEl.textContent = p.name;
      if (detailTextEl) {
        detailTextEl.textContent = `${p.scientific_name} · Probabilidad ${p.prediction_score}%`;
      }
      new mapboxgl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(`🐦 <b>${escapeHtml(p.name)}</b><br><i>${escapeHtml(p.scientific_name)}</i><br>Avistado: ${escapeHtml(p.observed_at)}${quantity}<br><b>Prob. reavistamiento: ${p.prediction_score}%</b>`)
        .addTo(map);
    });

    map.on("mouseenter", "bio-layer", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "bio-layer", () => { map.getCanvas().style.cursor = ""; });

    const sub = document.querySelector('[data-layer-sub="birds"]');
    let birds = null;
    const result = await global.TwinmapApi?.getBirds?.();
    if (result?.ok && result.payload?.data?.features) {
      birds = result.payload.data;
    } else {
      try {
        const cache = await fetch(dataUrl("/data/birds.geojson"));
        if (cache.ok) birds = await cache.json();
      } catch {
        birds = null;
      }
    }

    if (birds?.features?.length) {
      const feats = birds.features.filter((f) => f.properties?.observed_at && !Number.isNaN(Date.parse(f.properties.observed_at)));
      if (feats.length) {
        const times = feats.map((f) => Date.parse(f.properties.observed_at));
        bioMinT = Math.min(...times);
        bioMaxDay = Math.max(1, Math.round((Math.max(...times) - bioMinT) / 86400000));
        feats.forEach((f) => {
          f.properties.dayidx = Math.round((Date.parse(f.properties.observed_at) - bioMinT) / 86400000);
        });
        map.getSource("bio").setData({ type: "FeatureCollection", features: feats });
      } else {
        map.getSource("bio").setData(birds);
      }
      if (sub) sub.textContent = `${birds.features.length.toLocaleString()} avistamientos (eBird)`;
    } else if (sub) {
      sub.textContent = "Aves no disponibles";
    }
  }

  function loadTraffic() {
    const sub = document.querySelector('[data-layer-sub="traffic"]');
    try {
      map.addSource("traffic", { type: "vector", url: "mapbox://mapbox.mapbox-traffic-v1" });
      map.addLayer({
        id: "traffic-live",
        type: "line",
        source: "traffic",
        "source-layer": "traffic",
        minzoom: 7,
        layout: { visibility: "visible", "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": [
            "match", ["get", "congestion"],
            "low", "#2ec4b6",
            "moderate", "#ffbf69",
            "heavy", "#ff8c42",
            "severe", "#ff4d4d",
            "#8a9aa5",
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 2, 12, 5],
          "line-opacity": 0.88,
        },
      });
      map.on("error", (event) => {
        if (event?.sourceId === "traffic" && sub) {
          sub.textContent = "Tráfico no disponible para esta cobertura";
        }
      });
    } catch {
      if (sub) sub.textContent = "Tráfico no disponible";
    }
  }

  async function loadNatureCatalog() {
    const empty = { type: "FeatureCollection", features: [] };
    map.addSource("nature", { type: "geojson", data: empty });
    map.addLayer({
      id: "nature-halo",
      type: "circle",
      source: "nature",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 9, 10, 22],
        "circle-color": "#90be6d",
        "circle-opacity": 0.2,
      },
    });
    map.addLayer({
      id: "nature-points",
      type: "circle",
      source: "nature",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 10, 9],
        "circle-color": "#90be6d",
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#0d1b2a",
        "circle-opacity": 0.96,
      },
    });
    map.addLayer({
      id: "nature-labels",
      type: "symbol",
      source: "nature",
      minzoom: 8,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 11,
        "text-offset": [0, 1.1],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#0d1b2a",
        "text-halo-width": 1.4,
      },
    });

    const sub = document.querySelector('[data-layer-sub="nature"]');
    try {
      const response = await fetch(dataUrl("/data/nature-curated.geojson"));
      if (response.ok) {
        const catalog = await response.json();
        map.getSource("nature").setData(catalog);
        if (sub) sub.textContent = `${catalog.features?.length || 0} lugares de referencia`;
      }
    } catch {
      if (sub) sub.textContent = "Catálogo no disponible";
    }
  }

  function addDepartments() {
    map.addSource("departments", { type: "geojson", data: dataUrl("/data/departments.geojson") });
    map.addLayer({
      id: "dept-fill",
      type: "fill",
      source: "departments",
      maxzoom: 10,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.6, 9, 0.4, 10, 0],
      },
    });
    map.addLayer({
      id: "dept-line",
      type: "line",
      source: "departments",
      maxzoom: 11,
      paint: {
        "line-color": "#ffffff",
        "line-width": 1.3,
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 6, 0.7, 10, 0.3, 11, 0],
      },
    });
    map.addLayer({
      id: "dept-label",
      type: "symbol",
      source: "departments",
      maxzoom: 10,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 13,
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#0d1b2a",
        "text-halo-width": 1.5,
      },
    });
  }

  function wireLayerToggles() {
    const bindings = {
      "lyr-pois": () => POI_LAYERS,
      "lyr-dept": () => DEPT_LAYERS,
      "lyr-crowds": () => CROWD_LAYERS,
      "lyr-birds": () => BIO_LAYERS,
      "lyr-traffic": () => TRAFFIC_LAYERS,
      "lyr-nature": () => NATURE_LAYERS,
      "lyr-3d": () => ["3d-buildings"],
    };

    layerPanelEl?.querySelectorAll("input[data-layer]").forEach((input) => {
      input.addEventListener("change", () => {
        const key = input.dataset.layer;
        if (key === "lyr-3d") {
          toggle3D(input.checked);
          return;
        }
        const layers = bindings[key]?.() || [];
        setLayerVisibility(layers, input.checked);
        input.closest("label")?.classList.toggle("is-active", input.checked);
      });
    });
  }

  function mountGeocoder() {
    if (!geocoderMountEl || geocoder || !global.MapboxGeocoder) return;
    geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      marker: { color: "#2ec4b6" },
      language: "es",
      placeholder: "Buscar lugar…",
      flyTo: { zoom: 12, speed: 1.6 },
    });
    geocoderMountEl.appendChild(geocoder.onAdd(map));
  }

  function useMyLocation() {
    if (!map || !navigator.geolocation) return;
    locationBtn.disabled = true;
    locationBtn.textContent = "Ubicando…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        if (myLocationMarker) myLocationMarker.remove();
        myLocationMarker = new mapboxgl.Marker({ color: "#2ec4b6" })
          .setLngLat(coords)
          .setPopup(new mapboxgl.Popup().setHTML("<b>Tu ubicación</b>"))
          .addTo(map);
        map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 13), duration: 900 });
        locationBtn.disabled = false;
        locationBtn.textContent = "Mi ubicación";
      },
      () => {
        locationBtn.disabled = false;
        locationBtn.textContent = "Mi ubicación";
        setStatus("No se pudo obtener tu ubicación. Revisa los permisos del navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function renderRecommendations(features) {
    if (!recommendationsEl) return;
    const cards = features
      .map((feature, index) => {
        const place = poiFeatureToPlace(feature, index);
        if (!place) return "";
        return `
          <article class="place-card explorar-place-card" data-place-lat="${place.lat}" data-place-lng="${place.lng}">
            <div class="image-placeholder"></div>
            <span class="tag">${place.category}</span>
            <h3 class="place-name">${escapeHtml(place.name)}</h3>
            <p>${escapeHtml(place.description)}</p>
            <small>${escapeHtml(place.location)}</small>
          </article>
        `;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join("");

    recommendationsEl.innerHTML = cards || "<p>No hay recomendaciones disponibles.</p>";

    recommendationsEl.querySelectorAll(".explorar-place-card").forEach((card) => {
      card.addEventListener("click", () => {
        const lat = Number(card.dataset.placeLat);
        const lng = Number(card.dataset.placeLng);
        if (map && Number.isFinite(lat) && Number.isFinite(lng)) {
          map.easeTo({ center: [lng, lat], zoom: 13, duration: 900 });
        }
      });
    });
  }

  async function bootMap() {
    if (!containerEl) return;

    const CFG = await resolveConfig();
    const token = CFG.MAPBOX_TOKEN;
    const hasToken = token && token.startsWith("pk.");

    if (!hasToken) {
      if (tokenWarnEl) tokenWarnEl.hidden = false;
      setStatus(
        "Sin token Mapbox. Copia frontend/src/js/config.example.js → config.js o define MAPBOX_ACCESS_TOKEN en .env del backend."
      );
      return;
    }

    if (tokenWarnEl) tokenWarnEl.hidden = true;
    mapboxgl.accessToken = token;

    map = new mapboxgl.Map({
      container: containerEl,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: CFG.CENTER || [-89.2, 13.7],
      zoom: CFG.ZOOM || 8,
      pitch: 50,
      bearing: -15,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.addControl(new mapboxgl.ScaleControl());

    map.on("style.load", async () => {
      map.addSource("dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: "dem", exaggeration: 1.2 });
      map.setFog({ "horizon-blend": 0.2, color: "#cfe8f0", "high-color": "#245", "space-color": "#0d1b2a" });

      map.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#8ecae6",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.85,
        },
      });

      addDepartments();
      await loadPOIs();
      await loadCrowds();
      await loadBirds();
      loadTraffic();
      await loadNatureCatalog();
      wireLayerToggles();
      mountGeocoder();
      initialized = true;
    });

    global._twinmapExplorar = map;
  }

  function ensureMap() {
    if (!initialized && !map) {
      void bootMap();
    } else if (map) {
      requestAnimationFrame(() => map.resize());
    }
  }

  locationBtn?.addEventListener("click", useMyLocation);

  global.TwinmapExplorar = {
    ensureMap,
    getMap: () => map,
  };
})(window);
