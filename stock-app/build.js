// Genera StockApp.html (un solo archivo, funciona sin internet) a partir de src/ y vendor/.
const fs = require("fs");
const path = require("path");
const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8").replace(/<\/script/gi, "<\\/script");
let html = fs.readFileSync(path.join(__dirname, "src/stock.src.html"), "utf8");
html = html.replace("/*JSPDF*/", () => read("vendor/jspdf.umd.min.js"));
html = html.replace("/*AUTOTABLE*/", () => read("vendor/jspdf.plugin.autotable.min.js"));
fs.writeFileSync(path.join(__dirname, "StockApp.html"), html);
console.log("StockApp.html generado (" + Math.round(html.length / 1024) + " KB)");
