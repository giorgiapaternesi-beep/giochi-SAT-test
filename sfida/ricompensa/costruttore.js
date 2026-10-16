/* =====================================================================
   GiochiSAT – costruttore del satellite (interfaccia)
   Per ogni parte del satellite (corpo, decorazione, pannelli…) si sceglie
   il pezzo e il colore: uno dei colori proposti oppure il colore esatto,
   con il selettore HSV (selettore-colore.js) e i colori scelti prima.
   "Casuale" sceglie tutto a caso.

     GiochiSATCostruttore.avvia(contenitore, {
       scelte,                          // scelte di partenza (vedi satellite.js)
       usati,                           // colori scelti in precedenza ["#RRGGBB", …]
       alCambio: function (scelte, usati) {}
     })
   ===================================================================== */
(function () {
  "use strict";

  var S = window.GiochiSATSatellite, G = window.GiochiSAT;
  var MAX_USATI = 12;
  var DADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>' +
    '<g fill="currentColor"><circle cx="8" cy="8" r="1.6"/><circle cx="16" cy="8" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/></g></svg>';

  function copia(x) { return JSON.parse(JSON.stringify(x)); }
  function valido(c) { return /^#[0-9A-F]{6}$/.test(c); }

  function avvia(contenitore, o) {
    var scelte = S.valide(o.scelte), usati = (o.usati || []).filter(valido).slice(0, MAX_USATI);
    var attiva = S.catalogo.sezioni[0].id, aperto = false;
    var inModifica = false;              // true mentre si regola un colore col selettore: conta solo l'ultimo

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
      '    <div class="cs-esatto" id="cs-esatto" hidden></div>' +
      "  </div></div>";

    var disegno = contenitore.querySelector(".cs-disegno"), schede = contenitore.querySelector(".cs-schede"),
        pezzi = contenitore.querySelector(".cs-pezzi"), colori = contenitore.querySelector(".cs-colori"),
        esatto = contenitore.querySelector(".cs-esatto");

    /* colori scelti prima: quelli scelti dalla persona, poi quelli già sul satellite */
    function elencoUsati() {
      var tutti = usati.slice();
      S.catalogo.sezioni.forEach(function (s) { var c = scelte[s.id].colore; if (tutti.indexOf(c) < 0) tutti.push(c); });
      return tutti.slice(0, MAX_USATI);
    }
    function ricorda(c, sostituisci) {
      var resto = sostituisci ? usati.slice(1) : usati;
      usati = [c].concat(resto.filter(function (x) { return x !== c; })).slice(0, MAX_USATI);
      selettore.usati(elencoUsati());
    }
    function salva() { if (o.alCambio) o.alCambio(copia(scelte), usati.slice()); }

    /* --- disegno delle varie parti dell'interfaccia --- */
    function disegnaSatellite() { disegno.innerHTML = S.svg(scelte); }
    function disegnaSchede() {
      schede.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-sezione") === attiva)); });
    }
    /* anteprime dei pezzi: il satellite intero con quel pezzo, inquadrato sulla parte */
    function disegnaPezzi() {
      var sez = S.sezione(attiva);
      pezzi.innerHTML = sez.pezzi.map(function (p) {
        var prova = copia(scelte); prova[attiva].pezzo = p.id;
        return '<button type="button" data-pezzo="' + p.id + '">' + S.svg(prova, sez.riquadro) + "<span>" + G.testo(p.nome) + "</span></button>";
      }).join("");
      aggiornaPezzi();
    }
    function aggiornaPezzi() {
      pezzi.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-pezzo") === scelte[attiva].pezzo)); });
    }
    function disegnaColori() {
      colori.innerHTML = S.colori(S.sezione(attiva)).map(function (c) {
        return '<button type="button" data-colore="' + c + '" style="--c:' + c + '" aria-label="Colore ' + c + '"></button>';
      }).join("") +
        '<button type="button" class="cs-libero" aria-controls="cs-esatto"><span class="cs-ruota" aria-hidden="true"></span>Colore esatto</button>';
      aggiornaColori();
    }
    function aggiornaColori() {
      var c = scelte[attiva].colore, proposto = false;
      colori.querySelectorAll("button[data-colore]").forEach(function (b) {
        var si = b.getAttribute("data-colore") === c; proposto = proposto || si;
        b.setAttribute("aria-pressed", String(si));
      });
      var libero = colori.querySelector(".cs-libero");
      libero.classList.toggle("cs-scelto", !proposto);
      libero.style.setProperty("--c", c);
      libero.setAttribute("aria-expanded", String(aperto));
    }
    function tutto() { disegnaSatellite(); disegnaSchede(); disegnaPezzi(); disegnaColori(); selettore.imposta(scelte[attiva].colore); selettore.usati(elencoUsati()); }

    /* --- selettore HSV del colore esatto --- */
    var selettore = GiochiSATSelettoreColore.crea(esatto, {
      colore: scelte[attiva].colore, usati: [],
      alCambio: function (c, definitivo) {
        scelte[attiva].colore = c;
        disegnaSatellite(); aggiornaColori();
        if (definitivo) { ricorda(c, inModifica); inModifica = true; disegnaPezzi(); salva(); }
      }
    });

    /* --- comandi --- */
    schede.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-sezione]"); if (!b) return;
      attiva = b.getAttribute("data-sezione"); inModifica = false;
      disegnaSchede(); disegnaPezzi(); disegnaColori(); selettore.imposta(scelte[attiva].colore);
    });
    pezzi.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-pezzo]"); if (!b) return;
      scelte[attiva].pezzo = b.getAttribute("data-pezzo");
      disegnaSatellite(); aggiornaPezzi(); salva();
    });
    colori.addEventListener("click", function (e) {
      if (e.target.closest(".cs-libero")) {                 // apre (o chiude) il selettore HSV
        aperto = !aperto; esatto.hidden = !aperto; inModifica = false; aggiornaColori();
        if (aperto) { selettore.imposta(scelte[attiva].colore); esatto.querySelector(".sc-campo").focus({ preventScroll: true }); }
        return;
      }
      var b = e.target.closest("button[data-colore]"); if (!b) return;
      var c = b.getAttribute("data-colore");
      scelte[attiva].colore = c; ricorda(c); inModifica = false;
      disegnaSatellite(); aggiornaColori(); disegnaPezzi(); selettore.imposta(c); salva();
    });
    contenitore.querySelector(".cs-casuale").addEventListener("click", function () {
      scelte = S.casuali(); inModifica = false; tutto(); salva();
      if (!G.movimentoRidotto) { disegno.classList.remove("cs-gira"); void disegno.offsetWidth; disegno.classList.add("cs-gira"); }
    });

    tutto();
    return { scelte: function () { return copia(scelte); } };
  }

  window.GiochiSATCostruttore = { avvia: avvia };
})();
