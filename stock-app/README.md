# Gestor de Stock

Programa sencillo para llevar un inventario interno de artículos y sacar el listado en PDF.

## Cómo usarlo

1. Descarga el archivo **`StockApp.html`**.
2. Ábrelo con doble clic (se abre en Chrome, Edge, Firefox o Safari). También funciona en el móvil.
3. No necesita instalación ni internet.

## Qué hace

- **Crear artículos**: código, nombre, categoría, cantidad, unidad, precio, stock mínimo, ubicación y notas.
- **Editar y eliminar** artículos. Botones **+ / −** para ajustar la cantidad rápidamente.
- **Buscar, filtrar** por categoría o por stock bajo, y **ordenar** pulsando en las cabeceras.
- **Generar PDF** del stock (con totales de unidades y valor). Si hay un filtro activo, el PDF sale solo con lo filtrado.
- Avisos en naranja/rojo cuando un artículo está por debajo del mínimo o sin existencias.

## Dónde se guardan los datos

Los datos se guardan automáticamente en el navegador del equipo donde lo abres.
Si cambias de navegador u ordenador, o borras los datos de navegación, no los verás.
Por eso conviene usar **"Copia de seguridad"** de vez en cuando (descarga un archivo `.json`)
y **"Restaurar copia"** para cargarlo en otro equipo.

## Para desarrolladores

`StockApp.html` se genera con `node build.js` a partir de `src/stock.src.html`
y las librerías de `vendor/` (jsPDF y jsPDF-AutoTable, licencia MIT).
