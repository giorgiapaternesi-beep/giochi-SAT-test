/* =====================================================================
   GiochiSAT – selettore di colore HSV
   Un quadrato per saturazione e luminosità, una barra per la tinta, il
   codice del colore e, sotto, i colori scelti in precedenza.

     var sel = GiochiSATSelettoreColore.crea(contenitore, {
       colore: "#RRGGBB",
       alCambio: function (colore, definitivo) {}   // definitivo: false mentre si trascina
     });
     sel.imposta("#RRGGBB")      cambia il colore mostrato (senza avvisare)
     sel.usati(["#RRGGBB", …])   aggiorna i colori scelti in precedenza
   ===================================================================== */
(function () {
  "use strict";

  function hsvInHex(h, s, v) {
    var f = function (n) { var k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return "#" + [f(5), f(3), f(1)].map(function (x) { return ("0" + Math.round(x * 255).toString(16)).slice(-2); }).join("").toUpperCase();
  }
  function hexInHsv(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), d = max - Math.min(r, g, b), h = 0;
    if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
  }
  function valido(hex) { return /^#[0-9a-f]{6}$/i.test(hex); }
  function limita(x) { return Math.max(0, Math.min(1, x)); }

  function crea(contenitore, o) {
    var hsv = hexInHsv(valido(o.colore) ? o.colore : "#FFFFFF");
    contenitore.innerHTML =
      '<div class="sc">' +
      '  <div class="sc-campo" tabindex="0" role="slider" aria-label="Saturazione e luminosità (frecce per cambiarle)"><span class="sc-pomo"></span></div>' +
      '  <input class="sc-tinta" type="range" min="0" max="359" step="1" aria-label="Tinta">' +
      '  <div class="sc-riga"><span class="sc-anteprima"></span>' +
      '    <label class="sc-codice"><span>Codice</span><input type="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Codice del colore"></label></div>' +
      '  <p class="sc-et">Colori scelti prima</p><div class="sc-usati"></div>' +
      "</div>";
    var campo = contenitore.querySelector(".sc-campo"), pomo = contenitore.querySelector(".sc-pomo"),
        tinta = contenitore.querySelector(".sc-tinta"), anteprima = contenitore.querySelector(".sc-anteprima"),
        codice = contenitore.querySelector(".sc-codice input"), usati = contenitore.querySelector(".sc-usati");

    function hex() { return hsvInHex(hsv.h, hsv.s, hsv.v); }
    function mostra() {
      var c = hex();
      campo.style.setProperty("--tinta", "hsl(" + Math.round(hsv.h) + " 100% 50%)");
      pomo.style.left = hsv.s * 100 + "%"; pomo.style.top = (1 - hsv.v) * 100 + "%"; pomo.style.background = c;
      campo.setAttribute("aria-valuetext", "saturazione " + Math.round(hsv.s * 100) + "%, luminosità " + Math.round(hsv.v * 100) + "%");
      tinta.value = Math.round(hsv.h);
      anteprima.style.background = c;
      if (document.activeElement !== codice) codice.value = c;
      usati.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-colore") === c)); });
    }
    function avvisa(definitivo) { mostra(); if (o.alCambio) o.alCambio(hex(), definitivo); }

    /* quadrato: trascinare con dito o mouse */
    function daPuntatore(e) {
      var r = campo.getBoundingClientRect();
      hsv.s = limita((e.clientX - r.left) / r.width); hsv.v = 1 - limita((e.clientY - r.top) / r.height);
      avvisa(false);
    }
    var trascino = false;
    campo.addEventListener("pointerdown", function (e) { trascino = true; campo.setPointerCapture(e.pointerId); campo.focus(); daPuntatore(e); e.preventDefault(); });
    campo.addEventListener("pointermove", function (e) { if (trascino) daPuntatore(e); });
    function fineTrascino() { if (trascino) { trascino = false; avvisa(true); } }
    campo.addEventListener("pointerup", fineTrascino);
    campo.addEventListener("pointercancel", fineTrascino);
    /* …o con la tastiera: frecce (con Maiusc passi più lunghi) */
    campo.addEventListener("keydown", function (e) {
      var passo = e.shiftKey ? 0.1 : 0.02, d = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }[e.key];
      if (!d) return;
      e.preventDefault(); hsv.s = limita(hsv.s + d[0]); hsv.v = limita(hsv.v + d[1]); avvisa(true);
    });
    tinta.addEventListener("input", function () { hsv.h = Number(tinta.value); avvisa(false); });
    tinta.addEventListener("change", function () { avvisa(true); });
    codice.addEventListener("change", function () {
      var v = codice.value.trim(); if (v[0] !== "#") v = "#" + v;
      if (valido(v)) { hsv = hexInHsv(v); avvisa(true); } else codice.value = hex();
    });
    usati.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-colore]"); if (!b) return;
      hsv = hexInHsv(b.getAttribute("data-colore")); avvisa(true);
    });

    var api = {
      imposta: function (c) { if (valido(c)) { hsv = hexInHsv(c); mostra(); } },
      usati: function (elenco) {
        usati.innerHTML = elenco.length ? elenco.map(function (c) {
          return '<button type="button" data-colore="' + c + '" style="--c:' + c + '" aria-label="Colore ' + c + '"></button>';
        }).join("") : '<span class="sc-vuoto">Qui compaiono i colori che scegli.</span>';
        mostra();
      }
    };
    api.usati(o.usati || []);
    return api;
  }

  window.GiochiSATSelettoreColore = { crea: crea, hsvInHex: hsvInHex, hexInHsv: hexInHsv };
})();
