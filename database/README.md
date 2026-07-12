# Base de datos mock de Mirus

Esta carpeta documenta la estructura de datos que usa el frontend.

Como el proyecto actual es un frontend estatico, el navegador no puede escribir directamente en archivos de esta carpeta. Por eso la app usa `localStorage` como base local temporal mediante `frontend/src/js/database.js`.

## Colecciones

- `bitacora`: lugares guardados por la persona usuaria.

## Migracion futura

Cuando exista backend, esta carpeta puede reemplazarse por una base real como SQLite, Firebase, Supabase o una API propia. La capa de datos local centraliza las operaciones básicas para facilitar ese cambio.
