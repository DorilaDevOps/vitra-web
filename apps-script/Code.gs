// =====================================================================
// VITRA - Backend con Google Apps Script
// ---------------------------------------------------------------------
// Este script se pega en: Extensions > Apps Script (dentro de la hoja
// de cálculo de Google) o como proyecto independiente en script.google.com.
// Luego se publica como "Web app".
//
// PASOS:
//  1) Crear una hoja de cálculo de Google (vacía) y abrir Apps Script.
//  2) Pegar este código completo en el editor.
//  3) Elegir la función "setTestCredentials" en el selector y ejecutarla
//     (crea el usuario de prueba: vitra / 123). Para cambiar después,
//     usá "setPassword" (autoriza permisos cuando lo pida).
//  4) Ejecutar "seedProducts" para cargar el catálogo actual
//     (crea la hoja "Vitra Catálogo" automáticamente si falta).
//  5) Deploy > New deployment > Web app:
//       - Execute as: Me
//       - Who has access: Anyone
//     Copiar la URL de la Web app (termina en /exec).
//  6) Pegar esa URL en:
//       - index.html      (constante APP_SCRIPT_URL)
//       - vitra-panel.html (constante APP_SCRIPT_URL)
// =====================================================================

var SHEET_NAME = 'Productos';
var HEADERS = ['id', 'title', 'subTitle', 'description', 'precio', 'tarjeta', 'category', 'src'];
var USER_KEY = 'ADMIN_USER';
var PASSWORD_KEY = 'ADMIN_PASSWORD';
var SPREADSHEET_ID_KEY = 'SPREADSHEET_ID';
var IMAGES_FOLDER = 'Vitra Imágenes';

// ---------------------------------------------------------------------
// WEB APP: lecturas públicas (GET)
// ---------------------------------------------------------------------
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'list';
    if (action === 'list') {
      return jsonResponse(listProducts());
    }
    return jsonResponse({ error: 'Acción desconocida: ' + action });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

// ---------------------------------------------------------------------
// WEB APP: acciones protegidas (POST) - requieren contraseña
// ---------------------------------------------------------------------
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents || '{}');
    }
    var action = body.action || (e && e.parameter && e.parameter.action) || '';
    var username = String(body.username || '').trim();
    var password = body.password || '';

    if (!checkPassword(username, password)) {
      return jsonResponse({ error: 'Usuario o contraseña incorrectos.' });
    }

    if (action === 'check') {
      return jsonResponse({ ok: true });
    }
    if (action === 'add') {
      return jsonResponse(addProduct(body));
    }
    if (action === 'delete') {
      return jsonResponse(deleteProduct(body.id));
    }
    return jsonResponse({ error: 'Acción desconocida: ' + action });
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

// ---------------------------------------------------------------------
// Login: usuario + contraseña contra las propiedades guardadas
// ---------------------------------------------------------------------
function checkPassword(username, password) {
  var props = PropertiesService.getScriptProperties();
  var now = Date.now();
  var failCount = Number(props.getProperty('FAIL_COUNT') || 0);
  var lastFail = Number(props.getProperty('LAST_FAIL') || 0);

  if (failCount >= 5 && now - lastFail < 5 * 60 * 1000) {
    throw new Error('Demasiados intentos. Esperá unos minutos e intentá de nuevo.');
  }

  var storedUser = String(props.getProperty(USER_KEY) || '');
  var storedPass = String(props.getProperty(PASSWORD_KEY) || '');

  if (username && username === storedUser && password && password === storedPass) {
    props.deleteProperty('FAIL_COUNT');
    props.deleteProperty('LAST_FAIL');
    return true;
  }

  props.setProperty('FAIL_COUNT', String(failCount + 1));
  props.setProperty('LAST_FAIL', String(now));
  return false;
}

// ---------------------------------------------------------------------
// Setup: usuario y contraseña de prueba (vitra / 123)
// ---------------------------------------------------------------------
function setTestCredentials() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(USER_KEY, 'vitra');
  props.setProperty(PASSWORD_KEY, '123');
  return 'Credenciales de prueba listas: usuario "vitra" / contraseña "123".';
}

// ---------------------------------------------------------------------
// Setup: definir usuario y contraseña del panel
// ---------------------------------------------------------------------
function setPassword() {
  var ui = SpreadsheetApp.getUi();
  var resUser = ui.prompt(
    'Usuario de administrador',
    'Escribí el nombre de usuario para entrar al panel:',
    ui.ButtonSet.OK_CANCEL
  );
  if (resUser.getSelectedButton() !== ui.Button.OK) return;
  var user = resUser.getResponseText().trim();
  if (!user) {
    ui.alert('El usuario no puede estar vacío.');
    return;
  }

  var resPass = ui.prompt(
    'Nueva contraseña de administrador',
    'Escribí la contraseña que usarás para entrar al panel:',
    ui.ButtonSet.OK_CANCEL
  );
  if (resPass.getSelectedButton() !== ui.Button.OK) return;
  var pass = resPass.getResponseText();
  if (!pass) {
    ui.alert('La contraseña no puede estar vacía.');
    return;
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(USER_KEY, user);
  props.setProperty(PASSWORD_KEY, pass);
  ui.alert('Usuario y contraseña guardados.');
}

// ---------------------------------------------------------------------
// Setup: cargar el catálogo actual (21 lentes) en la hoja
// ---------------------------------------------------------------------
function seedProducts() {
  var products = [
    ['0001', 'RALPH LAUREN', 'Exclusividad Total', 'Diseño único con armazón original y cristal nuevo polarizado ✨', 4400, null, 'all', './imgs/lentes21.png'],
    ['0002', 'LACOSTE', 'Vanguardia y Estilo', 'Nuevo polarizado, con filtro 400UV para máxima protección ♻️', 4600, null, 'all', './imgs/lentes19.png'],
    ['0003', 'GUESS', 'Lujo y Distinción', 'Diseño único con armazón original y cristal nuevo polarizado ☀️', 3500, null, 'all', './imgs/lentes20.png'],
    ['0004', 'Calvin Klein', 'Premium', 'De sol, ♻️☀️ con filtro 400UV para máxima protección✨', 2600, null, 'all', './imgs/lentes13.png'],
    ['0005', 'RALPH LAUREN', 'Elegancia Italiana', 'Diseño único con armazón original y cristal nuevo polarizado ☀️', 2600, null, 'all', './imgs/lente12.png'],
    ['0006', 'VERSACE', 'Exclusividad Total', 'Con filtro 400UV para máxima protección.🩵 ¡ÚNICO PAR!', 4400, null, 'all', './imgs/lente10.png'],
    ['0007', 'RAYBAN', 'Aviator Clásico', 'Cristales nuevos polarizados 💚', 5200, null, 'all', './imgs/lentes15.png'],
    ['0008', 'MYTHO', 'Deporivo All Terrain', 'Armazón original con cambio de cristales, protección UV y polarizado', 3700, null, 'all', './imgs/lentes17.png'],
    ['0009', 'DIOR', 'Exclusividad Total', 'Cristales nuevos polarizados 💚', 4800, null, 'all', './imgs/lentes16.png'],
    ['0010', 'Motor Oil', 'Tu Mejor elección', 'Diseño único con armazón original y cristal nuevo polarizado ♻️', 2300, null, 'all', './imgs/lente11.png'],
    ['0011', 'AIRE', '', 'Con filtro 400UV para máxima protección ¡Uno solo disponible!', 1900, null, 'all', './imgs/lentes9.png'],
    ['0012', 'Paco Rabanne', 'All Mind', 'Diseño único con armazón original y cristal nuevo polarizado, 🩵 ¡Uno solo disponible!', 2300, null, 'all', './imgs/lentes14.png'],
    ['0013', 'Second Hand', 'Super Selección', 'Me re copan los emprendimientos familiares que tienen un trasfondo más allá del negocio. 💚', '0X0', null, 'all', './imgs/lentes1.png'],
    ['0014', 'Giorgio Armani', 'Viva La Vida', 'Diseño único con armazón original y cristal nuevo polarizado ♻️', 3600, null, 'all', './imgs/lentes8.png'],
    ['0015', 'MYTHO', '', 'Con filtro 400UV para máxima protección. ♻️☀️', 2600, null, 'all', './imgs/lentes3.png'],
    ['0016', 'RAYBAN', 'Only You', 'Diseño único con armazón original y cristal ORIGINAL, (RB grabado en la última foto)♻️', 2900, null, 'all', './imgs/lentes7.png'],
    ['0017', 'NOVA', 'Elegancia y Estilo', 'Diseño único con armazón original y cristal nuevo polarizado', 2200, null, 'all', './imgs/lente4.png'],
    ['0018', 'CARRERA', 'Máxima Fortaleza', 'Filtro 400UV para máxima protección. ♻️☀️¡Solo uno en stock!', 2800, null, 'all', './imgs/lentes6.png'],
    ['0019', 'MORMAII', 'Deporte y Yo', 'Diseño único con armazón original y cristal nuevo polarizad☀️', 2900, null, 'all', './imgs/lente2.png'],
    ['0020', 'Ralph Lauren', 'Mismo Estilo', '☀️ ¡Uno solo disponible!', 3500, null, 'all', './imgs/lentes18.png'],
    ['0021', 'RAYBAN', 'Nada Más Alto', 'Diseño único con armazón original y cristal ORIGINAL, (RB grabado en la última foto)♻️', 3600, null, 'all', './imgs/lente5.png']
  ];

  var sheet = getSheet();
  var lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
  }
  sheet.getRange(2, 1, products.length, HEADERS.length).setValues(products);
  return 'Catálogo cargado: ' + products.length + ' productos.';
}

// ---------------------------------------------------------------------
// Acceso a la hoja (funciona en proyecto independiente o dentro de la hoja)
// ---------------------------------------------------------------------
function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(SPREADSHEET_ID_KEY);
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      // la hoja ya no existe; creamos una nueva
    }
  }
  var ss = SpreadsheetApp.create('Vitra Catálogo');
  props.setProperty(SPREADSHEET_ID_KEY, ss.getId());
  return ss;
}

function getSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function readRows() {
  var sheet = getSheet();
  var lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
}

function writeRows(rows) {
  var sheet = getSheet();
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    var lastRow = Math.max(sheet.getLastRow(), 1);
    if (lastRow - 1 > rows.length) {
      sheet.getRange(2 + rows.length, 1, lastRow - 1 - rows.length, HEADERS.length).clearContent();
    }
  } else {
    var last = Math.max(sheet.getLastRow(), 1);
    if (last >= 2) {
      sheet.getRange(2, 1, last - 1, HEADERS.length).clearContent();
    }
  }
}

// ---------------------------------------------------------------------
// API: listar productos (nuevos primero)
// ---------------------------------------------------------------------
function listProducts() {
  var rows = readRows();
  var products = [];
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    var product = {};
    for (var c = 0; c < HEADERS.length; c++) {
      product[HEADERS[c]] = rows[i][c];
    }
    products.push(product);
  }
  return products;
}

// ---------------------------------------------------------------------
// API: agregar producto (se inserta arriba de todo = primero en la web)
// ---------------------------------------------------------------------
function addProduct(body) {
  var title = String(body.title || '').trim();
  var subTitle = String(body.subTitle || '').trim();
  var description = String(body.description || '').trim();

  if (!title) throw new Error('El nombre del lente es obligatorio.');

  var src = '';
  var imageBase64 = String(body.imageBase64 || '');
  if (imageBase64) {
    var imageType = String(body.imageType || 'image/jpeg');
    var fileId = saveImage(imageBase64, imageType);
    src = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';
  }

  var precio = body.precio;
  if (typeof precio === 'number') {
    precio = precio;
  } else {
    var n = Number(String(precio || '').trim());
    precio = String(precio).trim() !== '' && !isNaN(n) ? n : String(precio || '').trim();
  }

  var product = {
    id: 'p' + Utilities.getUuid(),
    title: title,
    subTitle: subTitle,
    description: description,
    precio: precio,
    tarjeta: body.tarjeta || null,
    category: 'all',
    src: src
  };

  var rows = readRows();
  rows.unshift(HEADERS.map(function (h) { return product[h]; }));
  writeRows(rows);
  return { ok: true, product: product };
}

// ---------------------------------------------------------------------
// API: eliminar producto por id (también borra su imagen de Drive)
// ---------------------------------------------------------------------
function deleteProduct(id) {
  if (!id) throw new Error('Falta el id del producto.');

  var rows = readRows();
  var remaining = [];
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      var src = String(rows[i][7] || '');
      var m = src.match(/id=([A-Za-z0-9_-]+)/);
      if (m) {
        try {
          DriveApp.getFileById(m[1]).setTrashed(true);
        } catch (e) {
          // la imagen ya no existe; seguimos con el borrado
        }
      }
      continue;
    }
    remaining.push(rows[i]);
  }
  writeRows(remaining);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Imágenes: guardar en una carpeta de Drive (visible "cualquiera con el enlace")
// ---------------------------------------------------------------------
function getImagesFolder() {
  var folders = DriveApp.getFoldersByName(IMAGES_FOLDER);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(IMAGES_FOLDER);
}

function saveImage(base64, contentType) {
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, contentType, 'lente.jpg');
  var file = getImagesFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
