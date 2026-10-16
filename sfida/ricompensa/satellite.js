/* =====================================================================
   GiochiSAT – il satellite da costruire: pezzi, scelte, disegno
   Usa il catalogo di assets/satellite/catalogo.js (GIOCHISAT_SATELLITE).

   Le scelte sono un oggetto { idSezione: { pezzo: "id", colore: "#rrggbb" } }.

     GiochiSATSatellite.carica()        → Promise: legge le immagini dei pezzi
     GiochiSATSatellite.predefinite()   → scelte di partenza
     GiochiSATSatellite.casuali()       → pezzi e colori a caso
     GiochiSATSatellite.valide(scelte)  → completa/corregge scelte salvate
     GiochiSATSatellite.svg(scelte, riquadro?) → disegno SVG (testo)
   ===================================================================== */
(function () {
  "use strict";

  var C = window.GIOCHISAT_SATELLITE;
  var immagini = {};                                // file → contenuto SVG (senza il tag <svg> esterno)

  function sezione(id) { return C.sezioni.filter(function (s) { return s.id === id; })[0]; }
  function pezzo(sez, id) { return sez.pezzi.filter(function (p) { return p.id === id; })[0]; }
  function coloriDi(sez) { return sez.colori || C.colori; }
  function aCaso(elenco) { return elenco[Math.floor(Math.random() * elenco.length)]; }
  function coloreValido(c) { return typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c); }

  /* legge un'immagine e ne tiene solo il contenuto, da mettere in un <g> */
  function leggi(file) {
    return fetch(GiochiSAT.url(C.cartella + file)).then(function (r) {
      if (!r.ok) throw new Error("Pezzo mancante: " + file);
      return r.text();
    }).then(function (testo) {
      var doc = new DOMParser().parseFromString(testo, "image/svg+xml"), radice = doc.documentElement;
      if (radice.nodeName !== "svg") throw new Error("Pezzo non valido: " + file);
      var s = new XMLSerializer(), contenuto = "";
      Array.prototype.forEach.call(radice.childNodes, function (n) { if (n.nodeType === 1) contenuto += s.serializeToString(n); });
      immagini[file] = contenuto;
    });
  }

  function carica() {
    var file = [];
    C.sezioni.forEach(function (s) { s.pezzi.forEach(function (p) { if (p.file && file.indexOf(p.file) < 0) file.push(p.file); }); });
    return Promise.all(file.map(leggi));
  }

  function predefinite() {
    var o = {};
    C.sezioni.forEach(function (s) { o[s.id] = { pezzo: s.pezzi[0].id, colore: s.colore }; });
    return o;
  }

  /* a caso, ma il corpo non ha mai lo stesso colore della decorazione */
  function casuali() {
    var o = {};
    C.sezioni.forEach(function (s) { o[s.id] = { pezzo: aCaso(s.pezzi).id, colore: aCaso(coloriDi(s)) }; });
    if (o.corpo && o.decoro) while (o.decoro.colore === o.corpo.colore) o.decoro.colore = aCaso(coloriDi(sezione("decoro")));
    return o;
  }

  function valide(scelte) {
    var o = predefinite();
    if (!scelte || typeof scelte !== "object") return o;
    C.sezioni.forEach(function (s) {
      var x = scelte[s.id];
      if (!x) return;
      if (pezzo(s, x.pezzo)) o[s.id].pezzo = x.pezzo;
      if (coloreValido(x.colore)) o[s.id].colore = x.colore.toUpperCase();
    });
    return o;
  }

  /* il disegno: i pezzi sovrapposti nell'ordine del catalogo, ognuno con il suo colore */
  function svg(scelte, riquadro) {
    var r = riquadro || C.riquadro, livelli = "";
    C.ordine.forEach(function (id) {
      var s = sezione(id), x = scelte[id], p = s && x && pezzo(s, x.pezzo);
      if (!p || !p.file || immagini[p.file] == null) return;
      livelli += '<g color="' + x.colore + '">' + immagini[p.file] + "</g>";
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + r.join(" ") + '" width="' + r[2] * 2 + '" height="' + r[3] * 2 + '">' + livelli + "</svg>";
  }

  window.GiochiSATSatellite = {
    catalogo: C, sezione: sezione, pezzo: pezzo, colori: coloriDi,
    carica: carica, predefinite: predefinite, casuali: casuali, valide: valide, svg: svg
  };
})();
