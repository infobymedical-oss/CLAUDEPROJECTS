# Mi Rutina — app para registrar tus entrenamientos

Tus rutinas y tu historial quedan guardados en una **hoja de Google de tu cuenta**, y la app se usa
desde un **enlace** en el iPhone (con ícono en la pantalla de inicio, como una app).
Solo **tú** puedes abrirla, con tu cuenta de Google.

La instalación conviene hacerla **desde una computadora** y lleva unos 10 minutos. Solo se hace una vez.

---

## 1. Crear la hoja

1. Entra en <https://sheets.new> y ponle de nombre **Mi Rutina**.

## 2. Pegar el código

1. En la hoja, menú **Extensiones → Apps Script**.
2. En el archivo **Código.gs**, **borra todo** y pega el contenido completo de **`Codigo.gs`**.
3. A la izquierda, junto a **Archivos**, pulsa **+** → **HTML**, llámalo exactamente **`Index`** y pulsa Enter.
4. Borra lo que trae y pega el contenido completo de **`Index.html`**.
5. Pulsa **guardar** (💾).

## 3. Publicar la app

1. **Implementar → Nueva implementación** → engranaje ⚙️ → **Aplicación web**.
2. Rellena:
   - **Ejecutar como:** **Yo**
   - **Quién tiene acceso:** **Solo yo**
3. **Implementar** → **Autorizar acceso** → elige tu cuenta.
   Si aparece “**Google no ha verificado esta aplicación**”: **Configuración avanzada** → **Ir a … (no seguro)** → **Permitir**.
   Es normal: la app la creaste tú y solo accede a esta hoja.
4. Copia la **URL de la aplicación web** (termina en `/exec`) y envíatela al iPhone (por WhatsApp a ti mismo, correo, notas…).

## 4. Ponerla en el iPhone

1. Abre el enlace en **Safari**. La primera vez te pedirá iniciar sesión con tu cuenta de Google.
2. Botón **Compartir** → **Agregar a pantalla de inicio**.

---

## Cómo se usa

- **Entrenar**: elige una rutina y pulsa **Empezar**. Cada ejercicio ya viene con los kilos y repeticiones
  **de la última vez**, así sabes qué superar. Ajusta los números y marca **✓** al terminar cada serie:
  arranca solo el **temporizador de descanso** (suena y vibra al terminar, donde el teléfono lo permita).
  Al final pulsa **Terminar entrenamiento** y, si quieres, deja una nota.
  Si cierras la app a mitad del entrenamiento, al volver sigue donde estabas.
- **Rutinas**: crea, edita, reordena o elimina rutinas y ejercicios. Cada ejercicio puede ser de
  **reps y peso** o **por tiempo** (plancha, cardio…), con series y descanso a tu gusto.
  Vienen dos rutinas de ejemplo (“Día A” y “Día B”) que puedes cambiar o borrar.
- **Historial**: todos tus entrenamientos; toca uno para ver el detalle.
- **Progreso**: entrenamientos por semana, racha de semanas seguidas y la evolución de cada ejercicio
  (peso máximo, repeticiones o tiempo). Toca el gráfico para ver cada punto.

En la hoja de cálculo verás tres pestañas (**Rutinas**, **Sesiones**, **Series**) con todos tus datos,
por si quieres mirarlos o exportarlos. No cambies el orden de las columnas.

**Nota sobre el sonido en iPhone:** si el iPhone está en modo silencio, el aviso del descanso no suena;
el contador sigue viéndose en pantalla.

## Cambiar algo más adelante

Si modificas el código: **Implementar → Gestionar implementaciones** → lápiz ✏️ → **Versión: Nueva versión** → **Implementar**.
El enlace no cambia.
