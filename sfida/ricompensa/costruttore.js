/* =====================================================================
   GiochiSAT – costruttore del satellite (interfaccia)
   Per ogni sezione del satellite (corpo, decorazione, pannelli…) si
   sceglie il pezzo e il colore; "Casuale" sceglie tutto a caso.

     GiochiSATCostruttore.avvia(contenitore, scelte, alCambio)
       scelte    scelte di partenza (vedi satellite.js)
       alCambio  funzione chiamata con le nuove scelte a ogni modifica
   ===================================================================== */
(function () {
  "use strict";

  var S = window.GiochiSATSatellite, G = window.GiochiSAT;
  var DADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<g fill="currentColor"><circle cx="8" cy="8" r="1.6"/><circle cx="16" cy="8" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/></g></svg>';

  function avvia(contenitore, scelteIniziali, alCambio) {
    var scelte = S.valide(scelteIniziali), attiva = S.catalogo.sezioni[0].id;

    contenitore.innerHTML =
      '<div class="cs">' +
      '  <div class="cs-anteprima gs-scheda"><div class="cs-disegno" role="img" aria-label="Il tuo satellite"></div>' +
      '    <button type="button" class="gs-btn gs-secondario cs-casuale">' + DADO + "Casuale</button></div>" +
      '  <div class="cs-pannello gs-scheda">' +
      '    <div class="cs-schede" role="tablist" aria-label="Parti del satellite">' + S.catalogo.sezioni.map(function (s) {
        return '<button type="button" role="tab" data-sezione="' + s.id + '">' + G.testo(s.nome) + "</button>";
      }).join("") + "</div>" +
      '    <h3 class="cs-et">Pezzo</h3><div class="cs-pezzi"></div>' +
      '    <h3 class="cs-et">Colore</h3><div class="cs-colori"></div>' +
      "  </div></div>";

    var disegno = contenitore.querySelector(".cs-disegno"), schede = contenitore.querySelector(".cs-schede"),
        pezzi = contenitore.querySelector(".cs-pezzi"), colori = contenitore.querySelector(".cs-colori");

    function cambia() { disegna(); if (alCambio) alCambio(JSON.parse(JSON.stringify(scelte))); }

    function disegna() {
      disegno.innerHTML = S.svg(scelte);
      var sez = S.sezione(attiva), mia = scelte[attiva];
      schede.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-sezione") === attiva)); });
      /* anteprime dei pezzi: il satellite intero con quel pezzo, inquadrato sulla sezione */
      pezzi.innerHTML = sez.pezzi.map(function (p) {
        var prova = JSON.parse(JSON.stringify(scelte)); prova[attiva].pezzo = p.id;
        return '<button type="button" data-pezzo="' + p.id + '" aria-pressed="' + (p.id === mia.pezzo) + '">' +
          S.svg(prova, sez.riquadro) + "<span>" + G.testo(p.nome) + "</span></button>";
      }).join("");
      var proposti = S.colori(sez), libero = proposti.indexOf(mia.colore.toUpperCase()) < 0;
      colori.innerHTML = proposti.map(function (c) {
        return '<button type="button" data-colore="' + c + '" style="--c:' + c + '" aria-pressed="' + (c === mia.colore.toUpperCase()) +
          '" aria-label="Colore ' + c + '"></button>';
      }).join("") +
        '<label class="cs-libero' + (libero ? " cs-scelto" : "") + '" style="--c:' + mia.colore + '"><input type="color" value="' + mia.colore +
        '" aria-label="Scegli il colore esatto"><span>Colore esatto</span></label>';
    }

    schede.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-sezione]"); if (!b) return;
      attiva = b.getAttribute("data-sezione"); disegna();
    });
    pezzi.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-pezzo]"); if (!b) return;
      scelte[attiva].pezzo = b.getAttribute("data-pezzo"); cambia();
    });
    colori.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-colore]"); if (!b) return;
      scelte[attiva].colore = b.getAttribute("data-colore"); cambia();
    });
    /* colore esatto: il disegno segue il selettore mentre si sceglie */
    colori.addEventListener("input", function (e) {
      if (e.target.type !== "color") return;
      scelte[attiva].colore = e.target.value.toUpperCase();
      disegno.innerHTML = S.svg(scelte);
    });
    colori.addEventListener("change", function (e) { if (e.target.type === "color") cambia(); });
    contenitore.querySelector(".cs-casuale").addEventListener("click", function () {
      scelte = S.casuali(); cambia();
      if (!G.movimentoRidotto) { disegno.classList.remove("cs-gira"); void disegno.offsetWidth; disegno.classList.add("cs-gira"); }
    });

    disegna();
    return { scelte: function () { return JSON.parse(JSON.stringify(scelte)); } };
  }

  window.GiochiSATCostruttore = { avvia: avvia };
})();
