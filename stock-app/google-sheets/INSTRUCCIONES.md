# Gestor de Stock compartido con Google Sheets

El stock queda guardado en una **hoja de Google** de tu cuenta, y la app se usa desde un **enlace**
en cualquier iPhone, Android o computadora. Todas las personas ven el mismo stock y cada cambio
queda registrado con el nombre de quién lo hizo.

Necesitas una cuenta de Google (Gmail sirve). La instalación conviene hacerla **desde una computadora** y lleva unos 10 minutos.
Solo se hace una vez.

---

## 1. Crear la hoja

1. Entra en <https://sheets.new> (crea una hoja de cálculo nueva).
2. Arriba a la izquierda, cámbiale el nombre a algo como **Stock empresa**.

## 2. Pegar el código

1. En la hoja, menú **Extensiones → Apps Script**. Se abre una pestaña nueva con un editor.
2. Verás un archivo **Código.gs** con unas líneas de ejemplo. **Borra todo** lo que tiene.
3. Abre el archivo **`Codigo.gs`** que te pasé, copia **todo** su contenido y pégalo ahí.
4. Arriba del código hay dos ajustes que puedes cambiar:
   - `var NOMBRE_EMPRESA = 'Mi empresa';` → pon el nombre de tu empresa entre las comillas.
   - `var CLAVE = '';` → si quieres que la app pida una clave para entrar, escríbela entre las comillas
     (por ejemplo `var CLAVE = 'stock2026';`). **Recomendado.**
5. A la izquierda, junto a **Archivos**, pulsa el **+** → **HTML**. Ponle de nombre exactamente **`Index`**
   (con I mayúscula, sin “.html”) y pulsa Enter.
6. Borra lo que trae ese archivo nuevo y pega **todo** el contenido del archivo **`Index.html`** que te pasé.
7. Pulsa el icono de **guardar** (💾) arriba.

## 3. Publicar la app

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Junto a “Seleccionar tipo”, pulsa el engranaje ⚙️ → **Aplicación web**.
3. Rellena:
   - **Descripción:** Stock
   - **Ejecutar como:** **Yo** (tu correo)
   - **Quién tiene acceso:** **Cualquier usuario**
4. Pulsa **Implementar**.
5. Google pedirá permisos: **Autorizar acceso** → elige tu cuenta.
   Aparecerá un aviso “**Google no ha verificado esta aplicación**”. Es normal porque la app la creaste tú:
   pulsa **Configuración avanzada** → **Ir a Stock (no seguro)** → **Permitir**.
   (Pide acceso a la hoja y a Google Drive, para guardar los PDF.)
6. Copia la **URL de la aplicación web** (termina en `/exec`). **Ese es el enlace de la app.**

## 4. Usarla en el iPhone (y en otros teléfonos)

1. Envía el enlace a cada persona (por WhatsApp, correo…).
2. En el iPhone, ábrelo con **Safari**.
3. Pulsa el botón **Compartir** (cuadrado con flecha) → **Agregar a pantalla de inicio**.
   Queda un ícono como si fuera una app.
4. La primera vez, la app pregunta el **nombre** de la persona (y la clave, si pusiste una).

En Android: ábrelo en Chrome → menú ⋮ → **Agregar a pantalla principal**.

---

## Cómo funciona

- **Hoja “Stock”**: aquí están todos los artículos. Puedes mirarla, filtrarla o exportarla a Excel
  cuando quieras. También puedes editar datos directamente en la hoja; la app los toma.
  No cambies el orden de las columnas ni el nombre de la pestaña.
- **Hoja “Movimientos”**: registro automático de cada alta, edición, entrada, salida, baja y PDF,
  con fecha y nombre de la persona.
- **Botón ±** en cada artículo: para registrar entradas o salidas de varias unidades (ej. `10` o `-4`).
- **Generar PDF**: crea el informe del stock (o de lo que tengas filtrado). Se abre con el botón
  **Abrir PDF** y además queda guardado en tu Google Drive, en la carpeta **Informes de stock**.
- La app se **actualiza sola cada 30 segundos** para mostrar los cambios de otras personas.
  También hay un botón **↻ Actualizar**.
- Si dos personas cambian el mismo artículo a la vez, las entradas/salidas se suman correctamente.

## Pasar los datos de la versión anterior (StockApp.html)

Si ya cargaste artículos en `StockApp.html`:

1. Ábrelo en el mismo navegador donde los cargaste y pulsa **Copia de seguridad** (descarga un `.json`).
2. En la app nueva, pulsa **Importar copia** y elige ese archivo. Los artículos se añaden al stock compartido.

## Seguridad

- Con “Quién tiene acceso: **Cualquier usuario**”, cualquiera que tenga el enlace puede usar la app.
  Por eso conviene poner una **CLAVE** y no publicar el enlace.
- Si todos tienen cuenta de Google, puedes elegir en su lugar “**Cualquier usuario con una cuenta de Google**”
  (pedirá iniciar sesión en Google).
- Los PDF se guardan en tu Drive compartidos “con cualquiera que tenga el enlace” para que todos puedan abrirlos.
- Google guarda el historial de la hoja: **Archivo → Historial de versiones**.

## Cambiar algo más adelante

Si modificas el código (por ejemplo, el nombre de la empresa o la clave), para que se aplique:
**Implementar → Gestionar implementaciones** → lápiz ✏️ → en **Versión** elige **Nueva versión** → **Implementar**.
El enlace sigue siendo el mismo.

## Problemas frecuentes

| Problema | Solución |
|---|---|
| “Script function not found: doGet” | El código no se guardó. Pulsa 💾 en el editor y vuelve a implementar como nueva versión. |
| Sale en blanco o un error que menciona “Index” | El archivo HTML debe llamarse exactamente `Index`. |
| Cambié el código y no se nota | Hay que publicar una **Nueva versión** (ver arriba). |
| Pide clave y no la sé | Mírala en la línea `var CLAVE = ...` del código. |
