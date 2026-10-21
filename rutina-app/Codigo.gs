/**
 * Mi Rutina — registro de entrenamientos con Google Sheets + Apps Script
 *
 * Se pega en: Hoja de cálculo > Extensiones > Apps Script (archivo "Código.gs").
 * Ver INSTRUCCIONES.md para la instalación paso a paso.
 */

var HOJA_EJ = 'Rutinas';
var HOJA_SES = 'Sesiones';
var HOJA_SER = 'Series';

var COLS_EJ = ['id', 'rutina', 'orden', 'ejercicio', 'tipo', 'series', 'reps', 'peso', 'segundos', 'descanso', 'notas'];
var TIT_EJ = ['ID', 'Rutina', 'Orden', 'Ejercicio', 'Tipo (fuerza/tiempo)', 'Series', 'Repeticiones', 'Peso (kg)',
  'Segundos', 'Descanso (seg)', 'Notas'];
var COLS_SES = ['id', 'fecha', 'rutina', 'duracionMin', 'notas'];
var TIT_SES = ['ID', 'Fecha', 'Rutina', 'Duración (min)', 'Notas'];
var COLS_SER = ['sesionId', 'fecha', 'ejercicio', 'serie', 'reps', 'peso', 'segundos'];
var TIT_SER = ['Sesión', 'Fecha', 'Ejercicio', 'Serie', 'Repeticiones', 'Peso (kg)', 'Segundos'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Mi Rutina')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

// ---------- API ----------

function api_todo() {
  return {
    ejercicios: leer_(hoja_(HOJA_EJ), COLS_EJ).sort(function (a, b) {
      return String(a.rutina).localeCompare(String(b.rutina)) || (Number(a.orden) - Number(b.orden));
    }),
    sesiones: leer_(hoja_(HOJA_SES), COLS_SES),
    series: leer_(hoja_(HOJA_SER), COLS_SER)
  };
}

/** Guarda una rutina completa (reemplaza sus ejercicios). nombreAnterior permite renombrarla. */
function api_guardarRutina(nombre, ejercicios, nombreAnterior) {
  nombre = texto_(nombre, 60);
  if (!nombre) throw new Error('La rutina necesita un nombre.');
  if (!Array.isArray(ejercicios) || !ejercicios.length) throw new Error('Añade al menos un ejercicio.');
  return conBloqueo_(function () {
    var sh = hoja_(HOJA_EJ);
    var existentes = leer_(sh, COLS_EJ);
    var anterior = texto_(nombreAnterior, 60);
    if (nombre !== anterior && existentes.some(function (e) { return e.rutina === nombre; })) {
      throw new Error('Ya existe una rutina llamada "' + nombre + '".');
    }
    borrarFilas_(sh, existentes.filter(function (e) { return e.rutina === nombre || (anterior && e.rutina === anterior); }));
    var filas = ejercicios.filter(function (e) { return e && texto_(e.ejercicio, 80); }).map(function (e, i) {
      var tipo = e.tipo === 'tiempo' ? 'tiempo' : 'fuerza';
      return [Utilities.getUuid().slice(0, 8), nombre, i + 1, celda_(texto_(e.ejercicio, 80)), tipo,
        entero_(e.series, 1, 20, 3), tipo === 'fuerza' ? numero_(e.reps) : '', tipo === 'fuerza' ? numero_(e.peso) : '',
        tipo === 'tiempo' ? numero_(e.segundos) : '', numero_(e.descanso), celda_(texto_(e.notas, 300))];
    });
    if (!filas.length) throw new Error('Añade al menos un ejercicio con nombre.');
    sh.getRange(sh.getLastRow() + 1, 1, filas.length, COLS_EJ.length).setValues(filas);
    if (anterior && anterior !== nombre) {
      // Mantiene el historial asociado al nuevo nombre.
      var ses = hoja_(HOJA_SES), datos = ses.getDataRange().getValues();
      for (var r = 1; r < datos.length; r++) if (datos[r][2] === anterior) ses.getRange(r + 1, 3).setValue(celda_(nombre));
    }
    return api_todo();
  });
}

function api_eliminarRutina(nombre) {
  return conBloqueo_(function () {
    var sh = hoja_(HOJA_EJ);
    borrarFilas_(sh, leer_(sh, COLS_EJ).filter(function (e) { return e.rutina === nombre; }));
    return api_todo();
  });
}

/** Guarda un entrenamiento terminado con todas sus series. */
function api_guardarSesion(s) {
  if (!s || !Array.isArray(s.series) || !s.series.length) throw new Error('El entrenamiento no tiene series hechas.');
  return conBloqueo_(function () {
    var id = Utilities.getUuid().slice(0, 8);
    var fecha = s.fecha ? new Date(s.fecha) : new Date();
    if (isNaN(fecha.getTime())) fecha = new Date();
    hoja_(HOJA_SES).appendRow([id, fecha, celda_(texto_(s.rutina, 60)), numero_(s.duracionMin), celda_(texto_(s.notas, 500))]);
    var filas = s.series.map(function (x) {
      return [id, fecha, celda_(texto_(x.ejercicio, 80)), entero_(x.serie, 1, 99, 1),
        numero_(x.reps), numero_(x.peso), numero_(x.segundos)];
    });
    var sh = hoja_(HOJA_SER);
    sh.getRange(sh.getLastRow() + 1, 1, filas.length, COLS_SER.length).setValues(filas);
    return api_todo();
  });
}

function api_eliminarSesion(id) {
  return conBloqueo_(function () {
    var ses = hoja_(HOJA_SES), ser = hoja_(HOJA_SER);
    borrarFilas_(ses, leer_(ses, COLS_SES).filter(function (x) { return x.id === String(id); }));
    borrarFilas_(ser, leer_(ser, COLS_SER).filter(function (x) { return x.sesionId === String(id); }));
    return api_todo();
  });
}

// ---------- Hojas ----------

function hoja_(nombre) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    var tit = nombre === HOJA_EJ ? TIT_EJ : nombre === HOJA_SES ? TIT_SES : TIT_SER;
    sh.getRange(1, 1, 1, tit.length).setValues([tit])
      .setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    if (nombre === HOJA_SES || nombre === HOJA_SER) sh.getRange('B:B').setNumberFormat('dd/MM/yyyy HH:mm');
    if (nombre === HOJA_EJ) ejemplo_(sh);
  }
  return sh;
}

/** Rutinas de ejemplo para empezar (se pueden editar o borrar desde la app). */
function ejemplo_(sh) {
  var ej = [
    ['Día A · Tren superior', 'Press de banca', 'fuerza', 4, 10, 40, '', 90],
    ['Día A · Tren superior', 'Remo con mancuerna', 'fuerza', 3, 12, 16, '', 75],
    ['Día A · Tren superior', 'Press militar', 'fuerza', 3, 10, 20, '', 75],
    ['Día A · Tren superior', 'Plancha', 'tiempo', 3, '', '', 45, 45],
    ['Día B · Tren inferior', 'Sentadilla', 'fuerza', 4, 10, 50, '', 120],
    ['Día B · Tren inferior', 'Peso muerto rumano', 'fuerza', 3, 10, 40, '', 90],
    ['Día B · Tren inferior', 'Zancadas', 'fuerza', 3, 12, 10, '', 60],
    ['Día B · Tren inferior', 'Bicicleta', 'tiempo', 1, '', '', 600, 0]
  ];
  var orden = {};
  var filas = ej.map(function (e) {
    orden[e[0]] = (orden[e[0]] || 0) + 1;
    return [Utilities.getUuid().slice(0, 8), e[0], orden[e[0]], e[1], e[2], e[3], e[4], e[5], e[6], e[7], ''];
  });
  sh.getRange(2, 1, filas.length, COLS_EJ.length).setValues(filas);
}

function leer_(sh, cols) {
  var v = sh.getDataRange().getValues(), out = [];
  for (var r = 1; r < v.length; r++) {
    if (v[r].join('') === '') continue;
    var o = { _fila: r + 1 };
    cols.forEach(function (c, i) {
      var x = v[r][i];
      o[c] = x instanceof Date ? x.toISOString() : (x === undefined ? '' : x);
    });
    if (o.id !== undefined) o.id = String(o.id);
    if (o.sesionId !== undefined) o.sesionId = String(o.sesionId);
    out.push(o);
  }
  return out.map(function (o) { var c = {}; for (var k in o) c[k] = o[k]; return c; });
}

/** Borra filas de abajo hacia arriba para no desplazar los índices. */
function borrarFilas_(sh, objs) {
  objs.map(function (o) { return o._fila; }).sort(function (a, b) { return b - a; })
    .forEach(function (f) { sh.deleteRow(f); });
}

// ---------- Utilidades ----------

function conBloqueo_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('La hoja está ocupada, prueba de nuevo en unos segundos.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function texto_(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
function numero_(v) {
  if (v === '' || v == null) return '';
  var n = parseFloat(String(v).replace(',', '.'));
  return isFinite(n) && n >= 0 ? n : '';
}
function entero_(v, min, max, def) {
  var n = parseInt(v, 10);
  return isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}
/** Evita que un texto que empieza por = + - @ se interprete como fórmula. */
function celda_(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }
