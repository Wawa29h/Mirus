(function (root) {
  const FILE_BY_KEY = {
    playa: "playa.png",
    playas: "playa.png",
    surf: "surf.png",
    volcan: "volcan.png",
    volcanes: "volcan.png",
    cascada: "cascada.png",
    cascadas: "cascada.png",
    parque: "parque.png",
    parques: "parque.png",
    montana: "montana.png",
    montanas: "montana.png",
    comida: "comida.png",
    restaurantes: "comida.png",
    hospedaje: "alojamiento.png",
    alojamiento: "alojamiento.png",
    eventos: "eventos.png",
    "pueblos-magicos": "iglesia.png",
    pueblos: "iglesia.png",
    cultura: "iglesia.png",
    historico: "iglesia.png",
    iglesia: "iglesia.png",
    eventos: "eventos.png",
    naturaleza: "montana.png",
    mirador: "montana.png",
    sendero: "parque.png",
    lago: "cascada.png",
    laguna: "cascada.png",
    rio: "cascada.png",
    pueblo: "iglesia.png",
    turismo: "eventos.png",
    aves: "montana.png",
    humedal: "parque.png",
    arrecife: "playa.png",
    otro: "parque.png",
  };

  const FILTER_FILES = {
    volcanes: "volcan.png",
    restaurantes: "comida.png",
    surf: "surf.png",
    montanas: "montana.png",
    cascada: "cascada.png",
    cascadas: "cascada.png",
    hospedaje: "alojamiento.png",
    eventos: "eventos.png",
    parques: "parque.png",
    playa: "playa.png",
    playas: "playa.png",
    "pueblos magicos": "iglesia.png",
    "pueblos-magicos": "iglesia.png",
  };

  const ALL_ICON_FILES = [...new Set([...Object.values(FILE_BY_KEY), ...Object.values(FILTER_FILES)])];
  const processedUrlByFile = new Map();
  let iconAssetsReady = null;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function assetBase() {
    if (root.TWINMAP_ASSETS_BASE) return root.TWINMAP_ASSETS_BASE;
    const path = root.location?.pathname || "";
    if (path.includes("/frontend")) return "assets/";
    return "/frontend/assets/";
  }

  function fileForCategory(category, kind) {
    const k = normalize(kind);
    if (k.includes("surf")) return "surf.png";
    if (k.includes("volcano") || k.includes("volcan")) return "volcan.png";
    if (k.includes("waterfall") || k.includes("cascada")) return "cascada.png";
    if (k.includes("viewpoint") || k.includes("mirador")) return "montana.png";
    if (k.includes("trail") || k.includes("sendero") || k.includes("hiking")) return "parque.png";
    if (k.includes("restaurant") || k.includes("cafe") || k.includes("fast_food") || k.includes("bar") || k.includes("food")) {
      return "comida.png";
    }
    if (k.includes("hotel") || k.includes("hostel") || k.includes("guest") || k.includes("motel")) return "alojamiento.png";
    if (k.includes("church") || k.includes("museum") || k.includes("archaeological") || k.includes("monument")) {
      return "iglesia.png";
    }
    if (k.includes("beach") || k.includes("playa")) return "playa.png";
    if (k.includes("park") || k.includes("parque")) return "parque.png";

    const key = normalize(category);
    if (FILE_BY_KEY[key]) return FILE_BY_KEY[key];
    if (FILTER_FILES[key]) return FILTER_FILES[key];
    return "parque.png";
  }

  function iconIdForFile(file) {
    return `tm-${String(file).replace(/\.png$/i, "")}`;
  }

  function iconIdForCategory(category, kind) {
    return iconIdForFile(fileForCategory(category, kind));
  }

  function rawUrlForFile(file) {
    return `${assetBase()}${file}`;
  }

  function urlForCategory(category, kind) {
    const file = fileForCategory(category, kind);
    return processedUrlByFile.get(file) || rawUrlForFile(file);
  }

  function prepareMapIconCanvas(source) {
    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;
    const size = Math.max(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return source;

    ctx.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);

    const imgData = ctx.getImageData(0, 0, size, size);
    const { data } = imgData;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 1;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4;
        if (Math.hypot(x - cx, y - cy) > radius) data[i + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  async function fetchImageBitmap(file) {
    const response = await fetch(rawUrlForFile(file));
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${file}`);
    const blob = await response.blob();
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(blob);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo decodificar ${file}`));
      img.src = URL.createObjectURL(blob);
    });
  }

  async function cacheProcessedUrlForFile(file) {
    if (processedUrlByFile.has(file)) return processedUrlByFile.get(file);
    try {
      const bitmap = await fetchImageBitmap(file);
      const canvas = prepareMapIconCanvas(bitmap);
      if (bitmap.close) bitmap.close();
      const outBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (outBlob) {
        const url = URL.createObjectURL(outBlob);
        processedUrlByFile.set(file, url);
        return url;
      }
    } catch (error) {
      console.warn("Mirus icon prepare failed:", file, error);
    }
    return rawUrlForFile(file);
  }

  function prepareIconAssets(options) {
    const force = options?.force;
    if (force) {
      processedUrlByFile.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      });
      processedUrlByFile.clear();
      iconAssetsReady = null;
    }
    if (!iconAssetsReady) {
      iconAssetsReady = Promise.all(ALL_ICON_FILES.map((file) => cacheProcessedUrlForFile(file))).then(() => {
        refreshPinIcons();
      });
    }
    return iconAssetsReady;
  }

  function popupImageHtml(category, className, kind) {
    const url = urlForCategory(category, kind);
    const cls = className || "twinmap-popup-img";
    const label = String(category || "lugar").replace(/"/g, "&quot;");
    return `<img class="${cls}" src="${url}" alt="${label}" loading="lazy">`;
  }

  function thumbHtml(category, className, kind) {
    const url = urlForCategory(category, kind);
    const cls = className || "place-thumb place-thumb--icon";
    return `<div class="${cls}"><img src="${url}" alt="" loading="lazy"></div>`;
  }

  function assignMapIcon(feature) {
    if (!feature?.properties) return feature;
    const props = feature.properties;
    props.icon = iconIdForCategory(props.cat || props.category, props.kind);
    return feature;
  }

  function enrichGeoJson(geojson) {
    (geojson?.features || []).forEach(assignMapIcon);
    return geojson;
  }

  function createMarkerElement(category, kind, size) {
    const px = size || 20;
    const wrap = document.createElement("div");
    wrap.className = "twinmap-category-marker";
    wrap.style.width = `${px}px`;
    wrap.style.height = `${px}px`;
    const img = document.createElement("img");
    img.src = urlForCategory(category, kind);
    img.alt = "";
    img.width = px;
    img.height = px;
    wrap.appendChild(img);
    return wrap;
  }

  function createMapboxMarker(mapboxgl, lngLat, category, kind, options) {
    if (!mapboxgl?.Marker) return null;
    const el = createMarkerElement(category, kind, options?.size);
    return new mapboxgl.Marker({ element: el, anchor: options?.anchor || "bottom" }).setLngLat(lngLat);
  }

  function applyPinIcon(element, category, kind) {
    if (!element) return;
    element.dataset.placeCategory = category || "";
    if (kind) element.dataset.placeKind = kind;
    const url = urlForCategory(category, kind);
    element.classList.add("map-pin--icon");
    element.style.backgroundImage = `url("${url}")`;
  }

  function refreshPinIcons(rootNode) {
    const scope = rootNode || document;
    scope.querySelectorAll(".map-pin--icon[data-place-category]").forEach((pin) => {
      applyPinIcon(pin, pin.dataset.placeCategory, pin.dataset.placeKind || pin.dataset.placeType);
    });
  }

  function toMapboxImage(image) {
    try {
      const canvas = prepareMapIconCanvas(image);
      const ctx = canvas.getContext("2d");
      if (!ctx) return image;
      const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return { width, height, data: new Uint8Array(data) };
    } catch (error) {
      console.warn("Mirus icon raster fallback:", error);
      return image;
    }
  }

  function loadMapIcons(map, options) {
    if (!map) return Promise.resolve(0);
    const force = Boolean(options?.force);

    if (force) {
      ALL_ICON_FILES.forEach((file) => {
        const iconId = iconIdForFile(file);
        if (map.hasImage(iconId)) {
          try {
            map.removeImage(iconId);
          } catch {
            /* ignore */
          }
        }
      });
      map.__twinmapIconsLoaded = false;
      map.__twinmapIconsReady = null;
    }

    if (map.__twinmapIconsLoaded && !force) {
      return Promise.resolve(map.__twinmapIconsLoadedCount || 0);
    }

    if (map.__twinmapIconsReady && !force) return map.__twinmapIconsReady;

    map.__twinmapIconsReady = (async () => {
      let loaded = 0;
      for (const file of ALL_ICON_FILES) {
        const iconId = iconIdForFile(file);
        if (map.hasImage(iconId)) {
          loaded += 1;
          continue;
        }

        const url = rawUrlForFile(file);
        const image = await new Promise((resolve) => {
          map.loadImage(url, (error, img) => resolve(error ? null : img));
        });

        if (!image) {
          console.warn("Mirus icon load failed:", file, url);
          continue;
        }

        try {
          const payload = toMapboxImage(image);
          if (!map.hasImage(iconId)) {
            map.addImage(iconId, payload, { pixelRatio: 1, sdf: false });
          }
          loaded += 1;
        } catch (addError) {
          try {
            if (!map.hasImage(iconId)) map.addImage(iconId, image, { pixelRatio: 1, sdf: false });
            loaded += 1;
          } catch (rawError) {
            console.warn("Mirus icon add failed:", file, addError, rawError);
          }
        }
      }

      map.__twinmapIconsLoaded = loaded > 0;
      map.__twinmapIconsLoadedCount = loaded;
      console.info(`Mirus: ${loaded}/${ALL_ICON_FILES.length} iconos de categoría cargados`);
      return loaded;
    })();

    return map.__twinmapIconsReady;
  }

  if (typeof document !== "undefined") {
    const bootAssets = () => prepareIconAssets();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootAssets);
    } else {
      bootAssets();
    }
  }

  function listMapIcons(map) {
    if (!map) return [];
    return ALL_ICON_FILES.map((file) => iconIdForFile(file)).filter((id) => map.hasImage(id));
  }

  root.TwinmapCategoryImages = {
    assetBase,
    fileForCategory,
    iconIdForCategory,
    urlForCategory,
    popupImageHtml,
    thumbHtml,
    assignMapIcon,
    enrichGeoJson,
    createMarkerElement,
    createMapboxMarker,
    applyPinIcon,
    refreshPinIcons,
    prepareIconAssets,
    loadMapIcons,
    listMapIcons,
  };
})(typeof window !== "undefined" ? window : globalThis);
