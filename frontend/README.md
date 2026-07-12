# Digital Map - Mockup

## Descripción

Digital Map es un mockup estático de una aplicación para explorar lugares, rutas y recomendaciones turísticas. El objetivo de esta versión es presentar la estructura general de la experiencia: landing inicial, navegación superior, panel de inicio, vista de mapa, capas, filtros y pantallas base.

Esta entrega se enfoca en estructura y flujo de navegación. Incluye una integración configurable con NewsData.io para noticias en vivo y conserva mocks locales cuando no hay API key o falla la conexión.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript vanilla
- Servidor local con `python -m http.server`

## Estructura del repositorio

```txt
digitalmap-3/
â”œâ”€â”€ docs/
â”‚   â””â”€â”€ arquitectura.md
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ css/
â”‚   â”‚   â””â”€â”€ styles.css
â”‚   â””â”€â”€ js/
â”‚       â””â”€â”€ script.js
â”œâ”€â”€ index.html
â””â”€â”€ README.md
```

## Instalación

No requiere instalación de dependencias de Node ni paquetes externos.

Requisitos mínimos:

- Tener Python instalado para levantar un servidor local simple.
- Usar un navegador moderno.

## Ejecución

Desde la raíz del proyecto:

```bash
python -m http.server 5173
```

Luego abrir:

```txt
http://localhost:5173
```

Actualmente el mockup está corriendo en:

```txt
http://localhost:5173
```

## Variables de entorno

No se requiere archivo `.env` para esta versión estática. Para activar NewsData.io en local, configura la API key en el navegador:

```js
localStorage.setItem("twinmap-newsdata-api-key", "TU_API_KEY")
```

Luego recarga la página. También puede definirse temporalmente `window.TWINMAP_NEWSDATA_API_KEY`, pero no debe subirse una llave real al repositorio.

## Flujo implementado

1. La primera pantalla es una landing page.
2. La landing no muestra topbar.
3. El botón `Comenzar` lleva al panel interno de la aplicación.
4. Al entrar a la aplicación aparece la topbar.
5. La topbar permite navegar entre las secciones principales.

## Navegación principal

La topbar contiene:

- Inicio
- Explorar mapa
- Mi bitácora
- Guardados
- Números de emergencia
- Configuración

## Funcionalidades completas, simuladas y pendientes

### Completas en este mockup

- Landing inicial sin topbar.
- Botón `Comenzar` que entra al panel interno.
- Topbar visible solo dentro de la aplicación.
- Navegación entre vistas usando JavaScript.
- Pantalla de Inicio con recomendaciones, logros, IA y novedades.
- Pantalla Explorar mapa con mapa simulado, capas, filtros y recomendaciones.
- Pantallas base para bitácora, guardados, emergencia, configuración y acerca de.
- Layout responsive básico.

### Simuladas

- Mapa interactivo: representado con un mockup visual en HTML/CSS.
- Recomendaciones: tarjetas estáticas de ejemplo.
- Capas del mapa: botones visuales sin lógica real de filtrado.
- Filtros: chips visuales sin lógica real.
- Perfil: botón visual sin pantalla funcional.
- IA de gustos: bloque informativo simulado.
- Novedades: listado estático.
- Noticias en vivo: integración configurable con NewsData.io y fallback a mocks locales.

### Pendientes

- Integración con un mapa real.
- API o backend para lugares, rutas y recomendaciones.
- Autenticación de usuario.
- Persistencia de guardados y bitácora.
- Funcionalidad real de filtros y capas.
- Datos reales de números de emergencia.
- Diseño visual final.
- Pruebas automatizadas.

## Datos de prueba y mocks

Los datos de prueba están escritos directamente en `index.html` como placeholders:

- Tarjetas con `Nombre lugar`.
- Descripciones breves.
- Distancias mock.
- Capas del mapa.
- Filtros visuales.
- Novedades de ejemplo.

No hay seeders ni archivos externos de datos en esta versión.

## Capas del mapa

En `Explorar mapa` se agregaron estas capas:

- Hoteles
- Restaurantes
- Eventos tendencias
- Volcanes
- Surf
- Parques
- Montañas
- Playas
- Cascadas
- Pueblos mágicos
- Sitios históricos

## Endpoints, APIs e integraciones

La vista `Números de emergencia` puede consultar NewsData.io para mostrar noticias recientes filtradas por búsqueda, ruta o zona.

Endpoint usado:

```txt
https://newsdata.io/api/1/latest
```

Parámetros principales usados por el mockup:

- `apikey`: llave de NewsData.io configurada en el navegador.
- `q`: lugar, zona o consulta de noticias.
- `country=sv`: noticias asociadas a El Salvador.
- `language=es`: resultados en español.
- `size=10`: cantidad máxima de resultados solicitados.

Si no hay API key o la petición falla, la app muestra datos mock filtrados.

La aplicación funciona principalmente en frontend estático:

- `index.html` define la estructura.
- `src/css/styles.css` define la maqueta visual.
- `src/js/script.js` controla el cambio entre pantallas.
- `src/js/emergencia-noticias.js` controla números de emergencia, noticias mock y consumo de NewsData.io.
## Modelo de datos

No hay modelo de datos formal todavía. Los elementos representados en el mockup sugieren futuras entidades:

- Usuario
- Lugar
- Categoría o capa
- Recomendación
- Bitácora
- Guardado
- Novedad
- Número de emergencia

## Prompts o IA

No se consume ningún modelo de IA real. La sección `La IA aprendió de tus gustos` es únicamente un placeholder de interfaz.

## Arquitectura

La arquitectura actual es frontend estático. Hay un diagrama simple en:

[docs/arquitectura.md](docs/arquitectura.md)

Resumen:

```txt
Navegador
  â†“
index.html
  â”œâ”€â”€ src/css/styles.css
  â””â”€â”€ src/js/script.js
```

## Criterio de aceptación

Este repositorio permite comprender cómo fue construida la solución porque:

- La estructura de carpetas separa HTML, CSS, JS y documentación.
- El README explica instalación, ejecución, tecnologías y estado funcional.
- Las funcionalidades completas, simuladas y pendientes están identificadas.
- Las integraciones y datos mock están documentados.
- La arquitectura técnica está resumida y diagramada.



