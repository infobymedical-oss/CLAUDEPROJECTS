/**
 * Gestor de Stock compartido — Google Sheets + Apps Script
 *
 * Se pega en: Hoja de cálculo > Extensiones > Apps Script (archivo "Código.gs").
 * Ver INSTRUCCIONES.md para la instalación paso a paso.
 */

// ================== CONFIGURACIÓN (puedes cambiar esto) ==================

// Nombre que aparece arriba en la app y en los PDF.
var NOMBRE_EMPRESA = 'Mi empresa';

// Clave opcional para entrar a la app. Déjala vacía ('') para no pedir clave.
// Ejemplo: var CLAVE = 'stock2026';
var CLAVE = '';

// ========================================================================

var HOJA_STOCK = 'Stock';
var HOJA_MOV = 'Movimientos';
var CARPETA_PDF = 'Informes de stock';

var COLS = ['id', 'codigo', 'nombre', 'categoria', 'cantidad', 'unidad', 'precio', 'minimo',
  'ubicacion', 'notas', 'creado', 'actualizado', 'actualizadoPor'];
var TITULOS = ['ID', 'Código', 'Nombre', 'Categoría', 'Cantidad', 'Unidad', 'Precio unitario ($U)',
  'Stock mínimo', 'Ubicación', 'Notas', 'Creado', 'Actualizado', 'Actualizado por'];
var TEXTOS = ['codigo', 'nombre', 'categoria', 'unidad', 'ubicacion', 'notas'];
var LIMITES = { codigo: 40, nombre: 120, categoria: 60, unidad: 20, ubicacion: 60, notas: 500 };

// ---------- Web app ----------

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Stock · ' + NOMBRE_EMPRESA)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

// ---------- API llamada desde la app (google.script.run) ----------

function api_config() {
  return { empresa: NOMBRE_EMPRESA, requiereClave: !!CLAVE };
}

function api_listar(clave) {
  verificarClave_(clave);
  return leerItems_().map(limpiarParaCliente_);
}

/** Crea o actualiza un artículo. Devuelve la lista actualizada. */
function api_guardar(clave, usuario, data) {
  verificarClave_(clave);
  return conBloqueo_(function () {
    var sh = hojaStock_();
    var items = leerItems_();
    var limpio = normalizar_(data);
    var ahora = new Date();
    usuario = nombreUsuario_(usuario);

    if (data.id) {
      var it = buscar_(items, data.id);
      if (!it) throw new Error('Ese artículo ya no existe (quizás otra persona lo eliminó).');
      // Si la cantidad no se tocó en el formulario, se respeta la actual
      // (otra persona pudo haberla cambiado mientras se editaba).
      if (data.cantidadOriginal !== undefined && Number(data.cantidadOriginal) === limpio.cantidad) {
        limpio.cantidad = Number(it.cantidad) || 0;
      }
      var cambios = describirCambios_(it, limpio);
      COLS.forEach(function (c) { if (limpio.hasOwnProperty(c)) it[c] = limpio[c]; });
      it.actualizado = ahora;
      it.actualizadoPor = usuario;
      escribirFila_(sh, it._fila, it);
      registrar_(usuario, 'Editar', it, cambios || 'Sin cambios');
    } else {
      limpio.id = Utilities.getUuid().slice(0, 8);
      limpio.creado = ahora;
      limpio.actualizado = ahora;
      limpio.actualizadoPor = usuario;
      sh.appendRow(COLS.map(function (c) { return valorCelda_(limpio[c]); }));
      registrar_(usuario, 'Alta', limpio, 'Cantidad inicial: ' + limpio.cantidad);
    }
    return leerItems_().map(limpiarParaCliente_);
  });
}

/** Suma o resta cantidad (operación segura aunque varias personas la usen a la vez). */
function api_ajustar(clave, usuario, id, delta) {
  verificarClave_(clave);
  return conBloqueo_(function () {
    var it = buscar_(leerItems_(), id);
    if (!it) throw new Error('Ese artículo ya no existe (quizás otra persona lo eliminó).');
    delta = Number(delta) || 0;
    var antes = Number(it.cantidad) || 0;
    it.cantidad = Math.max(0, antes + delta);
    it.actualizado = new Date();
    it.actualizadoPor = nombreUsuario_(usuario);
    escribirFila_(hojaStock_(), it._fila, it);
    registrar_(it.actualizadoPor, delta >= 0 ? 'Entrada' : 'Salida', it,
      (delta >= 0 ? '+' : '') + delta + ' (de ' + antes + ' a ' + it.cantidad + ')');
    return leerItems_().map(limpiarParaCliente_);
  });
}

function api_eliminar(clave, usuario, id) {
  verificarClave_(clave);
  return conBloqueo_(function () {
    var it = buscar_(leerItems_(), id);
    if (it) {
      hojaStock_().deleteRow(it._fila);
      registrar_(nombreUsuario_(usuario), 'Baja', it, 'Cantidad al eliminar: ' + it.cantidad);
    }
    return leerItems_().map(limpiarParaCliente_);
  });
}

/** Importa artículos de una copia de seguridad de la versión sin conexión (StockApp.html). */
function api_importar(clave, usuario, lista) {
  verificarClave_(clave);
  if (!Array.isArray(lista)) throw new Error('El archivo no tiene el formato esperado.');
  return conBloqueo_(function () {
    var sh = hojaStock_();
    usuario = nombreUsuario_(usuario);
    var ahora = new Date();
    var filas = lista.filter(function (x) { return x && x.nombre; }).map(function (x) {
      var l = normalizar_(x);
      l.id = Utilities.getUuid().slice(0, 8);
      l.creado = ahora; l.actualizado = ahora; l.actualizadoPor = usuario;
      return COLS.map(function (c) { return valorCelda_(l[c]); });
    });
    if (filas.length) {
      sh.getRange(sh.getLastRow() + 1, 1, filas.length, COLS.length).setValues(filas);
      registrar_(usuario, 'Importar', { codigo: '', nombre: '' }, filas.length + ' artículos importados');
    }
    return leerItems_().map(limpiarParaCliente_);
  });
}

/** Genera un PDF con los artículos indicados (en ese orden) y lo guarda en Drive. */
function api_pdf(clave, usuario, ids, filtroTexto) {
  verificarClave_(clave);
  var todos = leerItems_();
  var porId = {};
  todos.forEach(function (it) { porId[it.id] = it; });
  var lista = (ids && ids.length ? ids.map(function (id) { return porId[id]; }) : todos)
    .filter(Boolean);
  if (!lista.length) throw new Error('No hay artículos para el PDF.');

  var tz = Session.getScriptTimeZone();
  var ahora = new Date();
  var html = htmlInforme_(lista, todos.length, filtroTexto,
    Utilities.formatDate(ahora, tz, 'dd/MM/yyyy HH:mm'), nombreUsuario_(usuario));
  var nombre = 'Stock ' + Utilities.formatDate(ahora, tz, 'yyyy-MM-dd HH.mm') + '.pdf';
  var pdf = Utilities.newBlob(html, MimeType.HTML, 'informe.html').getAs(MimeType.PDF).setName(nombre);

  var archivo = carpetaPdf_().createFile(pdf);
  // Visible para quien tenga el enlace, así cualquier usuario de la app lo puede abrir.
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  registrar_(nombreUsuario_(usuario), 'PDF', { codigo: '', nombre: '' }, nombre + ' (' + lista.length + ' artículos)');
  return { url: archivo.getUrl(), nombre: nombre };
}

// ---------- Hoja de cálculo ----------

function hojaStock_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA_STOCK);
  if (!sh) {
    sh = ss.insertSheet(HOJA_STOCK, 0);
    sh.getRange(1, 1, 1, TITULOS.length).setValues([TITULOS])
      .setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('G:G').setNumberFormat('"$" #,##0.00');
    sh.getRange('K:L').setNumberFormat('dd/MM/yyyy HH:mm');
    sh.setColumnWidth(3, 220);
    sh.setColumnWidth(10, 220);
  }
  return sh;
}

function hojaMov_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA_MOV);
  if (!sh) {
    sh = ss.insertSheet(HOJA_MOV);
    sh.getRange(1, 1, 1, 6).setValues([['Fecha', 'Usuario', 'Acción', 'Código', 'Artículo', 'Detalle']])
      .setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
    sh.setColumnWidth(5, 220);
    sh.setColumnWidth(6, 360);
  }
  return sh;
}

/** Lee todos los artículos. Las filas añadidas a mano en la hoja (sin ID) reciben uno. */
function leerItems_() {
  var sh = hojaStock_();
  var valores = sh.getDataRange().getValues();
  var items = [];
  for (var r = 1; r < valores.length; r++) {
    var fila = valores[r];
    var it = {};
    COLS.forEach(function (c, i) { it[c] = fila[i] === undefined ? '' : fila[i]; });
    if (String(it.nombre).trim() === '') continue;
    if (!it.id) {
      it.id = Utilities.getUuid().slice(0, 8);
      sh.getRange(r + 1, 1).setValue(it.id);
    }
    it.id = String(it.id);
    it._fila = r + 1;
    items.push(it);
  }
  return items;
}

function escribirFila_(sh, fila, it) {
  sh.getRange(fila, 1, 1, COLS.length).setValues([COLS.map(function (c) { return valorCelda_(it[c]); })]);
}

function registrar_(usuario, accion, it, detalle) {
  hojaMov_().appendRow([new Date(), usuario, accion, valorCelda_(it.codigo || ''),
    valorCelda_(it.nombre || ''), valorCelda_(detalle || '')]);
}

function carpetaPdf_() {
  var it = DriveApp.getFoldersByName(CARPETA_PDF);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA_PDF);
}

// ---------- Utilidades ----------

function verificarClave_(clave) {
  if (CLAVE && String(clave || '') !== String(CLAVE)) throw new Error('CLAVE_INCORRECTA');
}

function conBloqueo_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('La hoja está ocupada, prueba de nuevo en unos segundos.');
  try { return fn(); } finally { lock.releaseLock(); }
}

function buscar_(items, id) {
  for (var i = 0; i < items.length; i++) if (items[i].id === String(id)) return items[i];
  return null;
}

function nombreUsuario_(u) {
  u = String(u || '').trim().slice(0, 40);
  return u || 'Sin nombre';
}

function numero_(v) {
  if (v === '' || v === null || v === undefined) return '';
  var n = parseFloat(String(v).replace(',', '.'));
  return isFinite(n) ? n : '';
}

function normalizar_(d) {
  var o = {};
  TEXTOS.forEach(function (c) { o[c] = String(d[c] == null ? '' : d[c]).trim().slice(0, LIMITES[c]); });
  if (!o.nombre) throw new Error('El nombre del artículo es obligatorio.');
  var cant = numero_(d.cantidad);
  o.cantidad = cant === '' ? 0 : Math.max(0, cant);
  o.precio = numero_(d.precio);
  o.minimo = numero_(d.minimo);
  return o;
}

/** Evita que un texto que empieza por = + - @ se interprete como fórmula en la hoja. */
function valorCelda_(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v === undefined || v === null ? '' : v;
}

function limpiarParaCliente_(it) {
  var o = {};
  COLS.forEach(function (c) {
    var v = it[c];
    o[c] = v instanceof Date ? v.toISOString() : v;
  });
  return o;
}

function describirCambios_(antes, despues) {
  var nombres = { codigo: 'código', nombre: 'nombre', categoria: 'categoría', cantidad: 'cantidad',
    unidad: 'unidad', precio: 'precio', minimo: 'mínimo', ubicacion: 'ubicación', notas: 'notas' };
  var cambios = [];
  Object.keys(nombres).forEach(function (c) {
    if (String(antes[c]) !== String(despues[c])) {
      cambios.push(nombres[c] + ': ' + (antes[c] === '' ? '—' : antes[c]) + ' → ' + (despues[c] === '' ? '—' : despues[c]));
    }
  });
  return cambios.join('; ');
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function dinero_(n) {
  n = Number(n) || 0;
  var partes = n.toFixed(2).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return '$ ' + partes.join(',');
}

function cant_(n) {
  n = Number(n) || 0;
  var s = String(Math.round(n * 1000) / 1000).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return s.join(',');
}

function htmlInforme_(lista, total, filtroTexto, fecha, usuario) {
  var totU = 0, totV = 0;
  var filas = lista.map(function (it, i) {
    var cantidad = Number(it.cantidad) || 0;
    var valor = cantidad * (Number(it.precio) || 0);
    totU += cantidad; totV += valor;
    var bajo = it.minimo !== '' && cantidad <= Number(it.minimo);
    var color = cantidad <= 0 ? '#dc2626' : (bajo ? '#d97706' : '#111');
    return '<tr style="background:' + (i % 2 ? '#f3f5f9' : '#fff') + '">' +
      '<td>' + esc_(it.codigo) + '</td><td>' + esc_(it.nombre) + '</td><td>' + esc_(it.categoria) + '</td>' +
      '<td>' + esc_(it.ubicacion) + '</td>' +
      '<td class="n" style="color:' + color + '">' + cant_(cantidad) + (it.unidad ? ' ' + esc_(it.unidad) : '') + '</td>' +
      '<td class="n">' + (it.minimo !== '' ? cant_(it.minimo) : '') + '</td>' +
      '<td class="n">' + (it.precio !== '' ? dinero_(it.precio) : '') + '</td>' +
      '<td class="n">' + dinero_(valor) + '</td></tr>';
  }).join('');
  var sub = 'Generado: ' + esc_(fecha) + ' por ' + esc_(usuario);
  if (lista.length !== total) sub += ' · Listado filtrado (' + lista.length + ' de ' + total + ' artículos)';
  if (filtroTexto) sub += ' · ' + esc_(filtroTexto);
  return '<html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,sans-serif;font-size:9pt;color:#111;margin:0}' +
    'h1{font-size:16pt;margin:0 0 2px}.sub{color:#666;margin:0 0 10px}' +
    'table{width:100%;border-collapse:collapse}th{background:#dbe4ff;color:#111;text-align:left;padding:5px;border-bottom:2px solid #2563eb}' +
    'td{padding:4px 5px;border-bottom:1px solid #e2e5ea}.n{text-align:right}' +
    'tfoot td{font-weight:bold;background:#e6eaf2}' +
    '</style></head><body>' +
    '<h1>Informe de stock — ' + esc_(NOMBRE_EMPRESA) + '</h1><p class="sub">' + sub + '</p>' +
    '<table><thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Ubicación</th>' +
    '<th class="n">Cantidad</th><th class="n">Mínimo</th><th class="n">Precio unit.</th><th class="n">Valor</th></tr></thead>' +
    '<tbody>' + filas + '</tbody>' +
    '<tfoot><tr><td></td><td>TOTAL (' + lista.length + ' artículos)</td><td></td><td></td>' +
    '<td class="n">' + cant_(totU) + '</td><td></td><td></td><td class="n">' + dinero_(totV) + '</td></tr></tfoot>' +
    '</table></body></html>';
}
