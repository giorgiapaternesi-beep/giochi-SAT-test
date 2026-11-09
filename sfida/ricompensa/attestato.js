/* =====================================================================
   GiochiSAT – attestato di partecipazione della Sfida
   Immagine PNG 1080x1920 (formato delle storie di Instagram) disegnata
   su un <canvas>: soprannome, satellite costruito, difficoltà, punti,
   data e hashtag. Cornice, stelle e scritte hanno sfumature metalliche:
   oro, argento o bronzo secondo la difficoltà (config.js → attestato).

     GiochiSATAttestato.crea({
       nome, difficolta, nomeDifficolta, punti, data,   // data: Date
       satellite,                                        // disegno SVG (testo)
       proporzioni                                       // [larghezza, altezza] del disegno
     }) → Promise({ blob, url })
   ===================================================================== */
(function () {
  "use strict";

  var W = 1080, H = 1920;
  var CHIARO = "#F5F3FF", TENUE = "#BDB8EC";
  /* sfumature metalliche: riflesso, chiaro, medio, scuro, ombra */
  var METALLI = {
    oro:     ["#FFF4C2", "#FFE07A", "#F7C531", "#EE9F16", "#D2690C"],
    argento: ["#FFFFFF", "#EEF1F7", "#C8CEDA", "#9AA2B2", "#6F7788"],
    bronzo:  ["#FCE3CC", "#F2BE92", "#DB9155", "#B8672F", "#8A4720"]
  };
  var STELLA_SITO = "M0-12C.9-3.4 3.4-.9 12 0 3.4.9.9 3.4 0 12-.9 3.4-3.4.9-12 0-3.4-.9-.9-3.4 0-12Z";
  var FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

  function carattere(peso, misura) { return peso + " " + misura + "px " + FONT; }

  function immagine(src) {
    return new Promise(function (ok, ko) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = ko; i.src = src; });
  }

  function caratteriPronti() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(["700 100px Poppins", "600 40px Poppins", "500 32px Poppins"].map(function (f) { return document.fonts.load(f); }))
      .catch(function () {});
  }

  /* numeri a caso ma sempre uguali per lo stesso soprannome */
  function casuale(testo) {
    var s = 2166136261;
    for (var i = 0; i < testo.length; i++) { s ^= testo.charCodeAt(i); s = Math.imul(s, 16777619); }
    s >>>= 0;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }

  function arrotondato(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  /* sfumatura in diagonale (cornici): chiaro in alto a sinistra, scuro in basso a destra */
  function diagonale(c, m, x0, y0, x1, y1) {
    var g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, m[1]); g.addColorStop(0.4, m[2]); g.addColorStop(0.75, m[3]); g.addColorStop(1, m[4]);
    return g;
  }
  /* sfumatura verticale (scritte): riflesso in alto, poi sempre più scuro */
  function verticale(c, m, alto, basso) {
    var g = c.createLinearGradient(0, alto, 0, basso);
    g.addColorStop(0, m[0]); g.addColorStop(0.3, m[1]); g.addColorStop(0.62, m[2]); g.addColorStop(1, m[3]);
    return g;
  }

  /* stella a quattro punte "smussata": ogni punta ha un lato in luce e uno in ombra */
  function stellaMetallo(c, m, x, y, L) {
    var w = L * 0.2, O = [0, 0], N = [0, -L], E = [L, 0], S = [0, L], O2 = [-L, 0];
    var NE = [w, -w], SE = [w, w], SO = [-w, w], NO = [-w, -w];
    var faccette = [[NO, N, m[0]], [N, NE, m[2]], [NE, E, m[1]], [E, SE, m[3]], [SE, S, m[4]], [S, SO, m[3]], [SO, O2, m[2]], [O2, NO, m[0]]];
    c.save(); c.translate(x, y);
    var alone = c.createRadialGradient(0, 0, 0, 0, 0, L * 0.9);
    alone.addColorStop(0, m[1] + "66"); alone.addColorStop(1, m[1] + "00");
    c.fillStyle = alone; c.beginPath(); c.arc(0, 0, L * 0.9, 0, 7); c.fill();
    faccette.forEach(function (f) {
      c.beginPath(); c.moveTo(O[0], O[1]); c.lineTo(f[0][0], f[0][1]); c.lineTo(f[1][0], f[1][1]); c.closePath();
      c.fillStyle = f[2]; c.fill();
    });
    c.restore();
  }

  /* scritta che si rimpicciolisce finché non sta nella larghezza massima */
  function adatta(c, testo, peso, misura, minima, larghezza) {
    while (misura > minima) { c.font = carattere(peso, misura); if (c.measureText(testo).width <= larghezza) break; misura -= 4; }
    c.font = carattere(peso, misura);
    return misura;
  }

  function cielo(c, rnd) {
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#090B2A"); g.addColorStop(0.55, "#16134A"); g.addColorStop(1, "#2A1C62");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var blu = c.createRadialGradient(W * 0.92, H * 0.96, 0, W * 0.92, H * 0.96, 1000);      // bagliore blu in basso a destra
    blu.addColorStop(0, "rgba(40, 90, 220, .38)"); blu.addColorStop(1, "rgba(40, 90, 220, 0)");
    c.fillStyle = blu; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 220; i++) {
      c.globalAlpha = 0.3 + rnd() * 0.6; c.fillStyle = "#FFF6E0";
      c.beginPath(); c.arc(rnd() * W, rnd() * H, [0.8, 1.1, 1.5, 2][Math.floor(rnd() * 4)], 0, 7); c.fill();
    }
    var stella = new Path2D(STELLA_SITO), colori = ["#FFF6D8", "#FFE59A", "#BFE3FF"];
    for (var k = 0; k < 14; k++) {                                // stelline del sito, ai lati
      var x = rnd() < 0.5 ? 70 + rnd() * 150 : W - 70 - rnd() * 150;
      c.save(); c.translate(x, 200 + rnd() * (H - 400)); c.scale(0.6 + rnd() * 0.6, 0.6 + rnd() * 0.6);
      c.globalAlpha = 0.85; c.fillStyle = colori[Math.floor(rnd() * 3)]; c.fill(stella); c.restore();
    }
    c.globalAlpha = 1;
  }

  function crea(o) {
    var CFG = (window.GIOCHISAT_CONFIG || {}).attestato || {};
    var m = METALLI[(CFG.metallo || {})[o.difficolta]] || METALLI.oro;
    var tela = document.createElement("canvas"); tela.width = W; tela.height = H;
    var c = tela.getContext("2d");
    var sat = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(o.satellite);

    return Promise.all([caratteriPronti(), immagine(GiochiSAT.url("assets/logo-arpa-lazio.jpg")).catch(function () { return null; }), immagine(sat)])
      .then(function (r) {
        var logo = r[1], disegno = r[2];
        cielo(c, casuale(o.nome));

        /* cornice metallica, con un filo di luce all'interno */
        arrotondato(c, 34, 34, W - 68, H - 68, 64);
        c.lineWidth = 16; c.strokeStyle = diagonale(c, m, 0, 0, W, H); c.stroke();
        arrotondato(c, 47, 47, W - 94, H - 94, 52);
        c.lineWidth = 3; c.globalAlpha = 0.55; c.strokeStyle = diagonale(c, [m[0], m[0], m[1], m[2], m[3]], 0, 0, W, H); c.stroke();
        c.globalAlpha = 1;
        [[108, 108], [W - 108, 108], [108, H - 108], [W - 108, H - 108]].forEach(function (p) { stellaMetallo(c, m, p[0], p[1], 50); });

        /* intestazione: logo e nome del sito */
        var intestazione = CFG.intestazione || "Giochi SAT - ArpaLazio";
        c.font = carattere(600, 32);
        var lt = logo ? 64 + 18 : 0, largo = lt + c.measureText(intestazione).width, x0 = (W - largo) / 2;
        if (logo) {
          c.save(); arrotondato(c, x0, 100, 64, 64, 14); c.fillStyle = "#fff"; c.fill(); c.clip();
          var k = Math.min(64 / logo.width, 64 / logo.height);
          c.drawImage(logo, x0 + (64 - logo.width * k) / 2, 100 + (64 - logo.height * k) / 2, logo.width * k, logo.height * k);
          c.restore();
        }
        c.fillStyle = TENUE; c.textAlign = "left"; c.textBaseline = "alphabetic";
        c.fillText(intestazione, x0 + lt, 143);

        /* soprannome e titolo */
        c.textAlign = "center";
        adatta(c, o.nome, 700, 150, 70, 840);
        c.save(); c.shadowColor = "rgba(0,0,0,.35)"; c.shadowOffsetY = 5;
        c.fillStyle = CHIARO; c.fillText(o.nome, W / 2, 345); c.restore();
        c.font = carattere(600, 36); c.fillStyle = TENUE; c.fillText("Attestato di partecipazione", W / 2, 418);

        /* il satellite costruito, con un alone del colore del metallo */
        var alone = c.createRadialGradient(W / 2, 860, 0, W / 2, 860, 440);
        alone.addColorStop(0, m[2] + "38"); alone.addColorStop(1, m[2] + "00");
        c.fillStyle = alone; c.fillRect(0, 420, W, 880);
        var pr = o.proporzioni || [disegno.width, disegno.height], box = [110, 470, 860, 770];
        var s = Math.min(box[2] / pr[0], box[3] / pr[1]), dw = pr[0] * s, dh = pr[1] * s;
        c.drawImage(disegno, box[0] + (box[2] - dw) / 2, box[1] + (box[3] - dh) / 2, dw, dh);

        /* nome del satellite in un riquadro con bordo metallico e due stelle */
        var nomeSat = (CFG.nomeSatellite || "Satellite – {nome}").replace("{nome}", o.nome);
        adatta(c, nomeSat, 600, 40, 26, 720);
        var bw = c.measureText(nomeSat).width + 96, bx = (W - bw) / 2, by = 1290;
        arrotondato(c, bx, by, bw, 88, 26);
        c.fillStyle = "rgba(20, 18, 63, .9)"; c.fill();
        c.lineWidth = 5; c.strokeStyle = diagonale(c, m, bx, by, bx + bw, by + 88); c.stroke();
        c.fillStyle = CHIARO; c.fillText(nomeSat, W / 2, by + 58);
        stellaMetallo(c, m, bx - 58, by + 44, 34); stellaMetallo(c, m, bx + bw + 58, by + 44, 34);

        /* difficoltà e punti, in metallo */
        var modalita = "Modalità " + o.nomeDifficolta;
        var mis = adatta(c, modalita, 700, 100, 60, 900);
        c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowOffsetY = 4;
        c.fillStyle = verticale(c, m, 1515 - mis * 0.78, 1515 + mis * 0.05); c.fillText(modalita, W / 2, 1515); c.restore();

        var numero = Number(o.punti || 0).toLocaleString("it-IT"), parola = " punti";
        c.font = carattere(700, 84); var w1 = c.measureText(numero).width;
        c.font = carattere(600, 52); var w2 = c.measureText(parola).width;
        var px = (W - w1 - w2) / 2;
        c.textAlign = "left";
        c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowOffsetY = 4;
        c.font = carattere(700, 84); c.fillStyle = verticale(c, m, 1640 - 66, 1640 + 4); c.fillText(numero, px, 1640);
        c.restore();
        c.font = carattere(600, 52); c.fillStyle = CHIARO; c.fillText(parola, px + w1, 1640);

        /* data e hashtag */
        c.textAlign = "center"; c.fillStyle = TENUE;
        c.font = carattere(500, 32);
        c.fillText((o.data || new Date()).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }), W / 2, 1748);
        c.font = carattere(600, 32); c.fillText(CFG.hashtag || "#giochiSAT", W / 2, 1798);

        return new Promise(function (ok, ko) {
          tela.toBlob(function (blob) { if (blob) ok({ blob: blob, url: URL.createObjectURL(blob) }); else ko(new Error("Attestato non creato")); }, "image/png");
        });
      });
  }

  window.GiochiSATAttestato = { crea: crea, metalli: METALLI, larghezza: W, altezza: H };
})();
