# Digital Map - Mockup

## DescripciÃ³n

Digital Map es un mockup estÃ¡tico de una aplicaciÃ³n para explorar lugares, rutas y recomendaciones turÃ­sticas. El objetivo de esta versiÃ³n es presentar la estructura general de la experiencia: landing inicial, navegaciÃ³n superior, panel de inicio, vista de mapa, capas, filtros y pantallas base.

Esta entrega se enfoca en estructura y flujo de navegaciÃ³n. Incluye una integraciÃ³n configurable con NewsData.io para noticias en vivo y conserva mocks locales cuando no hay API key o falla la conexiÃ³n.

## TecnologÃ­as utilizadas

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

## InstalaciÃ³n

No requiere instalaciÃ³n de dependencias de Node ni paquetes externos.

Requisitos mÃ­nimos:

- Tener Python instalado para levantar un servidor local simple.
- Usar un navegador moderno.

## EjecuciÃ³n

Desde la raÃ­z del proyecto:

```bash
python -m http.server 5173
```

Luego abrir:

```txt
http://localhost:5173
```

Actualmente el mockup estÃ¡ corriendo en:

```txt
http://localhost:5173
```

## Variables de entorno

No se requiere archivo `.env` para esta versiÃ³n estÃ¡tica. Para activar NewsData.io en local, configura la API key en el navegador:

```js
localStorage.setItem("twinmap-newsdata-api-key", "TU_API_KEY")
```

Luego recarga la pÃ¡gina. TambiÃ©n puede definirse temporalmente `window.TWINMAP_NEWSDATA_API_KEY`, pero no debe subirse una llave real al repositorio.

## Flujo implementado

1. La primera pantalla es una landing page.
2. La landing no muestra topbar.
3. El botÃ³n `Comenzar` lleva al panel interno de la aplicaciÃ³n.
4. Al entrar a la aplicaciÃ³n aparece la topbar.
5. La topbar permite navegar entre las secciones principales.

## NavegaciÃ³n principal

La topbar contiene:

- Inicio
- Explorar mapa
- Mi bitÃ¡cora
- Guardados
- NÃºmeros de emergencia
- ConfiguraciÃ³n

## Funcionalidades completas, simuladas y pendientes

### Completas en este mockup

- Landing inicial sin topbar.
- BotÃ³n `Comenzar` que entra al panel interno.
- Topbar visible solo dentro de la aplicaciÃ³n.
- NavegaciÃ³n entre vistas usando JavaScript.
- Pantalla de Inicio con recomendaciones, logros, IA y novedades.
- Pantalla Explorar mapa con mapa simulado, capas, filtros y recomendaciones.
- Pantallas base para bitÃ¡cora, guardados, emergencia, configuraciÃ³n y acerca de.
- Layout responsive bÃ¡sico.

### Simuladas

- Mapa interactivo: representado con un mockup visual en HTML/CSS.
- Recomendaciones: tarjetas estÃ¡ticas de ejemplo.
- Capas del mapa: botones visuales sin lÃ³gica real de filtrado.
- Filtros: chips visuales sin lÃ³gica real.
- Perfil: botÃ³n visual sin pantalla funcional.
- IA de gustos: bloque informativo simulado.
- Novedades: listado estÃ¡tico.
- Noticias en vivo: integraciÃ³n configurable con NewsData.io y fallback a mocks locales.

### Pendientes

- IntegraciÃ³n con un mapa real.
- API o backend para lugares, rutas y recomendaciones.
- AutenticaciÃ³n de usuario.
- Persistencia de guardados y bitÃ¡cora.
- Funcionalidad real de filtros y capas.
- Datos reales de nÃºmeros de emergencia.
- DiseÃ±o visual final.
- Pruebas automatizadas.

## Datos de prueba y mocks

Los datos de prueba estÃ¡n escritos directamente en `index.html` como placeholders:

- Tarjetas con `Nombre lugar`.
- Descripciones breves.
- Distancias mock.
- Capas del mapa.
- Filtros visuales.
- Novedades de ejemplo.

No hay seeders ni archivos externos de datos en esta versiÃ³n.

## Capas del mapa

En `Explorar mapa` se agregaron estas capas:

- Hoteles
- Restaurantes
- Eventos tendencias
- Volcanes
- Surf
- Parques
- MontaÃ±as
- Playas
- Cascadas
- Pueblos mÃ¡gicos
- Sitios histÃ³ricos

## Endpoints, APIs e integraciones

La vista `NÃºmeros de emergencia` puede consultar NewsData.io para mostrar noticias recientes filtradas por bÃºsqueda, ruta o zona.

Endpoint usado:

```txt
https://newsdata.io/api/1/latest
```

ParÃ¡metros principales usados por el mockup:

- `apikey`: llave de NewsData.io configurada en el navegador.
- `q`: lugar, zona o consulta de noticias.
- `country=sv`: noticias asociadas a El Salvador.
- `language=es`: resultados en espaÃ±ol.
- `size=10`: cantidad mÃ¡xima de resultados solicitados.

Si no hay API key o la peticiÃ³n falla, la app muestra datos mock filtrados.

La aplicaciÃ³n funciona principalmente en frontend estÃ¡tico:

- `index.html` define la estructura.
- `src/css/styles.css` define la maqueta visual.
- `src/js/script.js` controla el cambio entre pantallas.
- `src/js/emergencia-noticias.js` controla nÃºmeros de emergencia, noticias mock y consumo de NewsData.io.
## Modelo de datos

No hay modelo de datos formal todavÃ­a. Los elementos representados en el mockup sugieren futuras entidades:

- Usuario
- Lugar
- CategorÃ­a o capa
- RecomendaciÃ³n
- BitÃ¡cora
- Guardado
- Novedad
- NÃºmero de emergencia

## Prompts o IA

No se consume ningÃºn modelo de IA real. La secciÃ³n `La IA aprendiÃ³ de tus gustos` es Ãºnicamente un placeholder de interfaz.

## Arquitectura

La arquitectura actual es frontend estÃ¡tico. Hay un diagrama simple en:

[docs/arquitectura.md](docs/arquitectura.md)

Resumen:

```txt
Navegador
  â†“
index.html
  â”œâ”€â”€ src/css/styles.css
  â””â”€â”€ src/js/script.js
```

## Criterio de aceptaciÃ³n

Este repositorio permite comprender cÃ³mo fue construida la soluciÃ³n porque:

- La estructura de carpetas separa HTML, CSS, JS y documentaciÃ³n.
- El README explica instalaciÃ³n, ejecuciÃ³n, tecnologÃ­as y estado funcional.
- Las funcionalidades completas, simuladas y pendientes estÃ¡n identificadas.
- Las integraciones y datos mock estÃ¡n documentados.
- La arquitectura tÃ©cnica estÃ¡ resumida y diagramada.



