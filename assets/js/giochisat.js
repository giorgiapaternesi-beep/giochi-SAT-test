/* =====================================================================
   GiochiSAT – script comune a tutte le pagine
   Da caricare nell'<head>, subito dopo assets/config.js:
     <script src="../assets/config.js"></script>
     <script src="../assets/js/giochisat.js"></script>

   Offre window.GiochiSAT con:
     .nome      soprannome del giocatore (vale finché non si ricarica la pagina)
     .sfida     modalità Sfida (giochi estratti a caso + tempo limite)
     .difficolta  difficoltà dei giochi (si sceglie solo prima di iniziare)
     .fineGioco(id, {completato, punti, giuste, totale})  da chiamare a fine partita
     .punti     punti della Sfida (regole in config.js → punti)
     .dialogo({...})   finestra di dialogo comune
     .giochi()  catalogo dei giochi preso da config.js
     .url(p)    indirizzo assoluto partendo dalla radice del sito

   Convenzione per i giochi: i pulsanti che servono solo in Esercitazione
   (Gioca ancora, Ricomincia, Menu…) hanno l'attributo data-gs-esercitazione
   e durante la Sfida vengono nascosti.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.GIOCHISAT_CONFIG || {};
  var script = document.currentScript;
  var RADICE = script ? new URL("../../", script.src).href : location.origin + "/";

  /* ------------------------------------------------------------------
     Memoria di sessione: sessionStorage se disponibile, altrimenti in RAM.
     sessionStorage resta nella scheda del browser e sparisce chiudendola.
     ------------------------------------------------------------------ */
  var ram = {};
  var memoria = {
    leggi: function (k) { try { var v = sessionStorage.getItem(k); return v === null ? (ram[k] || null) : v; } catch (e) { return ram[k] || null; } },
    scrivi: function (k, v) { ram[k] = v; try { sessionStorage.setItem(k, v); } catch (e) { /* modalità privata o bloccata */ } },
    togli: function (k) { delete ram[k]; try { sessionStorage.removeItem(k); } catch (e) { /* ignorato */ } }
  };

  function eRicarica() {
    try {
      var nav = performance.getEntriesByType("navigation")[0];
      if (nav) return nav.type === "reload";
      return !!(performance.navigation && performance.navigation.type === 1);
    } catch (e) { return false; }
  }

  function url(percorso) { return new URL(percorso || "", RADICE).href; }
  function giochi() { return (CFG.giochi || []).slice(); }
  function gioco(id) { return giochi().filter(function (g) { return g.id === id; })[0] || null; }
  function testo(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : String(t); return d.innerHTML; }
  function mescola(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); var m = Math.floor(s / 60); return m + ":" + String(s % 60).padStart(2, "0"); }
  var movimentoRidotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     Soprannome
     Nessuna registrazione: il soprannome resta in memoria mentre si passa
     da un gioco all'altro e viene dimenticato se si ricarica la pagina
     (utile sui monitor degli eventi, dove giocano persone diverse).
     ================================================================== */
  var CHIAVE_NOME = "giochisat:nome";
  if (eRicarica()) memoria.togli(CHIAVE_NOME);

  var nome = {
    MIN: 2, MAX: 15,
    get: function () { return memoria.leggi(CHIAVE_NOME) || ""; },
    pulisci: function (v) { return String(v || "").replace(/\s+/g, " ").trim().slice(0, nome.MAX); },
    /* Restituisce il messaggio d'errore oppure "" se il soprannome va bene. */
    errore: function (v) {
      v = nome.pulisci(v);
      if (v.length < nome.MIN) return "Il soprannome deve avere almeno " + nome.MIN + " caratteri.";
      if (!/^[\p{L}\p{N} ._-]+$/u.test(v)) return "Usa solo lettere, numeri, spazi, punto, trattino o underscore.";
      if (/\d{6,}/.test(v)) return "Niente numeri di telefono: usa un nome di fantasia.";
      return "";
    },
    set: function (v) {
      v = nome.pulisci(v);
      if (nome.errore(v)) return false;
      memoria.scrivi(CHIAVE_NOME, v);
      aggiornaChipNome();
      document.dispatchEvent(new CustomEvent("giochisat:nome", { detail: { nome: v } }));
      return true;
    },
    dimentica: function () { memoria.togli(CHIAVE_NOME); aggiornaChipNome(); },
    /* Chiede il soprannome con una finestra; restituisce una Promise. */
    chiedi: function (opzioni) {
      opzioni = opzioni || {};
      return new Promise(function (risolvi) {
        var d = creaDialogo();
        d.innerHTML =
          '<form method="dialog" novalidate>' +
          '<h2>' + testo(opzioni.titolo || "Come ti chiami in orbita?") + '</h2>' +
          '<p>' + testo(opzioni.testo || "Scegli un soprannome di fantasia, non il tuo nome vero. Lo useremo nei giochi finché non ricarichi la pagina.") + '</p>' +
          '<div class="gs-campo"><label for="gs-campo-nome">Soprannome</label>' +
          '<input id="gs-campo-nome" maxlength="' + nome.MAX + '" autocomplete="off" placeholder="Es. Stella23" value="' + testo(nome.get()) + '"></div>' +
          '<p class="gs-errore" aria-live="polite"></p>' +
          '<div class="gs-azioni"><button type="button" class="gs-btn gs-secondario" value="annulla">Annulla</button>' +
          '<button type="submit" class="gs-btn" value="ok">Conferma</button></div></form>';
        var campo = d.querySelector("input"), err = d.querySelector(".gs-errore"), form = d.querySelector("form");
        d.querySelector('[value="annulla"]').addEventListener("click", function () { d.close(); });
        form.addEventListener("submit", function (ev) {
          var e = nome.errore(campo.value);
          if (e) { ev.preventDefault(); err.textContent = e; campo.focus(); return; }
          nome.set(campo.value);
        });
        campo.addEventListener("input", function () { err.textContent = ""; });
        d.addEventListener("close", function () { var v = nome.get(); d.remove(); risolvi(v || null); }, { once: true });
        d.showModal(); campo.focus(); campo.select();
      });
    },
    /* Collega un campo di testo di un gioco al soprannome comune. */
    collega: function (campo) {
      if (!campo) return;
      if (!campo.value) campo.value = nome.get();
      campo.addEventListener("change", function () { if (!nome.errore(campo.value)) nome.set(campo.value); });
    }
  };

  function aggiornaChipNome() {
    var chip = document.querySelector(".gs-nome"), n = nome.get();
    if (!chip) return;
    chip.querySelector("span").textContent = n || "Soprannome";
    chip.classList.toggle("gs-vuoto", !n);
    chip.title = n ? "Soprannome: " + n + " (tocca per cambiarlo)" : "Scegli un soprannome";
  }

  /* ==================================================================
     Finestra di dialogo comune
     ================================================================== */
  function creaDialogo() {
    var d = document.createElement("dialog");
    d.className = "gs-dialogo";
    document.body.appendChild(d);
    return d;
  }
  /* GiochiSAT.dialogo({titolo, testo, azioni:[{id, etichetta, secondario}]}) → Promise(id) */
  function dialogo(o) {
    return new Promise(function (risolvi) {
      var d = creaDialogo();
      d.innerHTML = '<h2>' + testo(o.titolo) + '</h2>' + (o.testo ? '<p>' + testo(o.testo) + '</p>' : "") + (o.html || "") +
        '<div class="gs-azioni">' + (o.azioni || [{ id: "ok", etichetta: "OK" }]).map(function (a) {
          return '<button type="button" class="gs-btn' + (a.secondario ? " gs-secondario" : "") + '" data-id="' + testo(a.id) + '">' + testo(a.etichetta) + '</button>';
        }).join("") + '</div>';
      var scelta = o.annulla || null;
      d.querySelectorAll("button[data-id]").forEach(function (b) {
        b.addEventListener("click", function () { scelta = b.getAttribute("data-id"); d.close(); });
      });
      if (o.bloccante) d.addEventListener("cancel", function (e) { e.preventDefault(); });
      d.addEventListener("close", function () { d.remove(); risolvi(scelta); }, { once: true });
      d.showModal();
      var ultimo = d.querySelector(".gs-azioni button:last-child"); if (ultimo) ultimo.focus();
    });
  }

  /* ==================================================================
     Cielo stellato: puntini fissi, stelle che brillano, comete rare
     ================================================================== */
  /* La stella del sito: la usano il cielo di sfondo e i giochi (es. Prato stellato)
     tramite GiochiSAT.stella. I colori sono in giochisat.css (--gs-stella-1/2/3). */
  var STELLA = Object.freeze({
    viewBox: "-12 -12 24 24",
    forma: '<circle r="9" fill="currentColor" opacity=".16"/>' +
      '<path d="M0-12C.9-3.4 3.4-.9 12 0 3.4.9.9 3.4 0 12-.9 3.4-3.4.9-12 0-3.4-.9-.9-3.4 0-12Z" fill="currentColor"/>',
    colori: Object.freeze(["var(--gs-stella-1)", "var(--gs-stella-2)", "var(--gs-stella-3)"])
  });
  var STELLA_SVG = '<svg viewBox="' + STELLA.viewBox + '">' + STELLA.forma + "</svg>";

  function casuale(seme) { var s = seme >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function semeDa(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function cielo() {
    if (document.querySelector(".gs-cielo") || document.body.hasAttribute("data-gs-senza-cielo")) return;
    var rnd = casuale(semeDa(location.pathname));
    var el = document.createElement("div");
    el.className = "gs-cielo";
    el.setAttribute("aria-hidden", "true");
    var punti = "";
    for (var i = 0; i < 140; i++) {
      var r = [0.6, 0.8, 1, 1, 1.3, 1.7][Math.floor(rnd() * 6)];
      punti += '<circle cx="' + (rnd() * 100).toFixed(2) + '%" cy="' + (rnd() * 100).toFixed(2) + '%" r="' + r + '" fill="#FFF6E0" opacity="' + (0.3 + rnd() * 0.6).toFixed(2) + '"/>';
    }
    el.innerHTML = '<svg class="gs-puntini">' + punti + "</svg>";
    var quante = document.body.classList.contains("gs-pagina-home") ? 10 : 7;
    var colori = STELLA.colori;
    for (var k = 0; k < quante; k++) {
      var s = document.createElement("span");
      s.className = "gs-stella";
      s.style.cssText = "left:" + (3 + rnd() * 94).toFixed(1) + "%;top:" + (2 + rnd() * 70).toFixed(1) + "%;--d:" + [8, 10, 12, 14, 18][Math.floor(rnd() * 5)] +
        "px;--c:" + colori[Math.floor(rnd() * 3)] + ";--t:" + (2.6 + rnd() * 2.4).toFixed(1) + "s;--ritardo:-" + (rnd() * 4).toFixed(1) + "s";
      s.innerHTML = STELLA_SVG;
      el.appendChild(s);
    }
    document.body.prepend(el);
    if (!movimentoRidotto) programmaCometa(el, 8000 + Math.random() * 12000);
  }

  function programmaCometa(el, attesa) {
    setTimeout(function () {
      if (!document.hidden) {
        var c = document.createElement("span");
        c.className = "gs-cometa";
        var dx = -(360 + Math.random() * 260), dy = 160 + Math.random() * 140;
        var coda = Math.atan2(dy, dx) * 180 / Math.PI - 180;          // la coda punta all'indietro
        c.style.cssText = "--x:" + (55 + Math.random() * 40).toFixed(0) + "%;--y:" + (4 + Math.random() * 30).toFixed(0) +
          "%;--dx:" + dx.toFixed(0) + "px;--dy:" + dy.toFixed(0) + "px;--durata:" + (1.3 + Math.random() * 0.8).toFixed(2) + "s;transform:rotate(" + coda.toFixed(1) + "deg)";
        el.appendChild(c);
        c.addEventListener("animationend", function () { c.remove(); });
      }
      programmaCometa(el, 25000 + Math.random() * 35000);   // una ogni 25-60 secondi
    }, attesa);
  }

  /* ==================================================================
     Barra in alto: chip del soprannome e altezza per la barra della Sfida
     ================================================================== */
  function barra() {
    var b = document.querySelector(".gs-barra");
    if (!b) return;
    var chip = b.querySelector(".gs-nome");
    if (chip) { aggiornaChipNome(); chip.addEventListener("click", function () { nome.chiedi(); }); }
    var misura = function () { document.documentElement.style.setProperty("--gs-alto-barra", b.offsetHeight + "px"); };
    misura();
    if (window.ResizeObserver) new ResizeObserver(misura).observe(b);
  }

  /* ==================================================================
     Modalità Sfida
     Stato salvato in sessionStorage (resta anche ricaricando, così un
     ricaricamento per sbaglio non fa perdere la sfida).
     ================================================================== */
  var CHIAVE_SFIDA = "giochisat:sfida";
  function leggiSfida() { try { return JSON.parse(memoria.leggi(CHIAVE_SFIDA) || "null"); } catch (e) { return null; } }
  function scriviSfida(s) { memoria.scrivi(CHIAVE_SFIDA, JSON.stringify(s)); }
  function urlGiocoSfida(id) { var g = gioco(id); return url(g.percorso) + "?sfida=1"; }

  var sfida = {
    stato: leggiSfida,
    regole: function () { return (CFG.sfida && CFG.sfida.difficolta) || {}; },
    inCorso: function () { var s = leggiSfida(); return !!s && s.stato === "in_corso"; },
    tempoRimasto: function () { var s = leggiSfida(); return s ? s.scadenza - Date.now() : 0; },

    inizia: function (difficolta, nomeGiocatore) {
      var d = sfida.regole()[difficolta];
      if (!d) throw new Error("Difficoltà sconosciuta: " + difficolta);
      var singoli = giochi().filter(function (g) { return g.tipo === "single"; }).map(function (g) { return g.id; });
      var scelti = mescola(singoli).slice(0, Math.min(d.giochi, singoli.length));
      var ora = Date.now();
      scriviSfida({
        versione: 1, id: ora.toString(36), difficolta: difficolta, nome: nomeGiocatore || nome.get(),
        giochi: scelti, indice: 0, inizio: ora, scadenza: ora + d.minuti * 60000,
        inizioGioco: null, risultati: [], stato: "in_corso", fine: null
      });
      location.href = urlGiocoSfida(scelti[0]);
    },

    /* true se questa pagina è il gioco di turno della sfida */
    attiva: function () {
      var s = leggiSfida(), id = document.body && document.body.getAttribute("data-gioco");
      return !!s && s.stato === "in_corso" && !!id && s.giochi[s.indice] === id && /[?&]sfida=1\b/.test(location.search);
    },
    riprendi: function () { var s = leggiSfida(); if (s && s.stato === "in_corso") location.href = urlGiocoSfida(s.giochi[s.indice]); },
    abbandona: function () { chiudiSfida("abbandonata"); location.href = url("sfida/risultato/"); },
    /* chiude la sfida in corso senza cambiare pagina */
    annulla: function () { chiudiSfida("abbandonata"); },
    /* aggiunge dati alla sfida salvata (es. il satellite costruito) */
    annota: function (campi) { var s = leggiSfida(); if (!s) return null; Object.keys(campi).forEach(function (k) { s[k] = campi[k]; }); scriviSfida(s); return s; },
    risultato: function () { return url("sfida/risultato/"); }
  };

  /* ==================================================================
     Difficoltà dei giochi
     Si sceglie una sola volta, prima di iniziare, e non si cambia durante
     la partita:
       - Sfida: all'inizio della sfida, vale per tutti i giochi estratti;
       - Esercitazione: quando si apre un gioco dall'elenco, con una
         finestra; resta nell'indirizzo del gioco (?livello=...).
     Un gioco aperto senza difficoltà (es. da un QR code) rimanda
     all'elenco, che apre subito la finestra di scelta.
     ================================================================== */
  var LIVELLI = ["facile", "media", "difficile"];
  var CHIAVE_LIVELLO = "giochisat:livello:";       // ultima difficoltà scelta per ogni gioco
  var ELENCO_SINGLE = "esercitazione/singleplayer/";

  function livelliDi(id) { return (CFG.livelli || {})[id] || null; }
  function livelloNellIndirizzo() { var m = location.search.match(/[?&]livello=(facile|media|difficile)\b/); return m ? m[1] : null; }

  var difficolta = {
    elenco: LIVELLI.slice(),
    nome: function (d) { return ((CFG.difficolta || {})[d] || {}).nome || d; },
    /* true se il gioco ha più difficoltà (voce in config.js → livelli) */
    ha: function (id) { return !!livelliDi(id); },
    /* difficoltà della partita in corso per il gioco indicato */
    di: function (id) {
      if (sfida.attiva()) return leggiSfida().difficolta;
      var d = livelloNellIndirizzo() || memoria.leggi(CHIAVE_LIVELLO + id);
      return LIVELLI.indexOf(d) >= 0 ? d : (CFG.difficoltaPredefinita || "media");
    },
    /* parametri del gioco per la difficoltà della partita (da config.js), o null */
    parametri: function (id) { var t = livelliDi(id); return t ? (t[difficolta.di(id)] || null) : null; },
    /* Finestra "Scegli la difficoltà" → Promise(difficoltà scelta, oppure null se annullata) */
    scegli: function (id) {
      var t = livelliDi(id), g = gioco(id);
      if (!t || !g) return Promise.resolve(null);
      var ultima = memoria.leggi(CHIAVE_LIVELLO + id);                 // evidenziata come "ultima scelta"
      var proposta = ultima || CFG.difficoltaPredefinita || "media";      // pulsante pronto per Invio
      return new Promise(function (risolvi) {
        var d = creaDialogo(), scelta = null;
        d.classList.add("gs-dialogo-livello");
        d.style.setProperty("--gs-colore", g.colore);
        d.innerHTML = "<h2>" + testo(g.nome) + "</h2><p>Scegli la difficoltà: resterà la stessa per tutta la partita.</p>" +
          '<div class="gs-livelli">' + LIVELLI.map(function (l) {
            return '<button type="button" class="gs-livello-scelta" data-livello="' + l + '"' + (l === ultima ? ' aria-current="true"' : "") + ">" +
              "<b>" + testo(difficolta.nome(l)) + "</b><span>" + testo((t[l] || {}).descrizione || "") + "</span></button>";
          }).join("") + "</div>" +
          '<div class="gs-azioni"><button type="button" class="gs-btn gs-secondario" data-livello="">Annulla</button></div>';
        d.querySelectorAll("button[data-livello]").forEach(function (b) {
          b.addEventListener("click", function () { scelta = b.getAttribute("data-livello") || null; d.close(); });
        });
        d.addEventListener("close", function () {
          d.remove();
          if (scelta) memoria.scrivi(CHIAVE_LIVELLO + id, scelta);
          risolvi(scelta);
        }, { once: true });
        d.showModal();
        d.querySelector('.gs-livello-scelta[data-livello="' + proposta + '"]').focus();
      });
    },
    /* Chiede la difficoltà e apre il gioco */
    apri: function (id) {
      return difficolta.scegli(id).then(function (l) { if (l) location.href = url(gioco(id).percorso) + "?livello=" + l; return l; });
    }
  };

  /* Pagina di un gioco aperta senza difficoltà e fuori dalla sfida? Allora
     si ferma il caricamento (il gioco non parte) e si torna all'elenco. */
  function richiediDifficolta() {
    var pagina = location.href.split(/[?#]/)[0].replace(/index\.html$/, "");
    var g = giochi().filter(function (x) { return url(x.percorso) === pagina; })[0];
    if (!g || !livelliDi(g.id) || livelloNellIndirizzo()) return false;
    var s = leggiSfida();
    if (s && s.stato === "in_corso" && s.giochi[s.indice] === g.id && /[?&]sfida=1\b/.test(location.search)) return false;
    if (window.stop) window.stop();
    location.replace(url(ELENCO_SINGLE) + "?gioco=" + encodeURIComponent(g.id));
    return true;
  }

  /* Etichetta sotto la barra (solo da leggere): difficoltà della partita */
  function etichettaLivello() {
    var id = document.body.getAttribute("data-gioco"), t = livelliDi(id);
    if (!t || sfida.attiva()) return;
    var d = difficolta.di(id);
    var el = document.createElement("p");
    el.className = "gs-livello";
    el.style.setProperty("--c", "var(--gs-livello-" + d + ")");
    el.innerHTML = '<span class="gs-livello-nome">Difficoltà</span><b>' + testo(difficolta.nome(d)) + "</b>" +
      '<span class="gs-livello-descr">' + testo((t[d] || {}).descrizione || "") + "</span>";
    var barraEl = document.querySelector(".gs-barra");
    if (barraEl) barraEl.after(el); else document.body.prepend(el);
  }

  /* ==================================================================
     Conto alla rovescia per domande e anomalie
     GiochiSAT.contoAllaRovescia(secondi, contenitore, allaFine) → {ferma()}
     ================================================================== */
  function contoAllaRovescia(secondi, contenitore, allaFine) {
    var finto = { ferma: function () {} };
    if (!secondi || !contenitore) return finto;
    contenitore.innerHTML = '<div class="gs-tempo" role="timer" aria-live="off"><b><i></i></b><span></span></div>';
    var barraT = contenitore.querySelector("i"), num = contenitore.querySelector("span");
    var fine = Date.now() + secondi * 1000, finito = false;
    function batti() {
      var resto = Math.max(0, fine - Date.now());
      barraT.style.transform = "scaleX(" + (resto / (secondi * 1000)).toFixed(4) + ")";
      num.textContent = Math.ceil(resto / 1000) + " s";
      contenitore.firstChild.classList.toggle("gs-poco", resto < 5000);
      if (resto <= 0 && !finito) { finito = true; clearInterval(t); allaFine && allaFine(); }
    }
    var t = setInterval(batti, 100); batti();
    return { ferma: function () { finito = true; clearInterval(t); } };
  }

  function chiudiSfida(stato) {
    var s = leggiSfida(); if (!s || s.stato !== "in_corso") return s;
    s.stato = stato; s.fine = Date.now(); scriviSfida(s); return s;
  }

  function registra(esito, info) {
    var s = leggiSfida(); if (!s || s.stato !== "in_corso") return s;
    var id = s.giochi[s.indice];
    info = info || {};
    s.risultati.push({ id: id, esito: esito, ms: s.inizioGioco ? Date.now() - s.inizioGioco : null,
      punti: info.punti != null ? info.punti : null,
      giuste: info.giuste != null ? info.giuste : null, totale: info.totale != null ? info.totale : null });
    s.indice += 1; s.inizioGioco = null;
    if (s.indice >= s.giochi.length) {
      var tutti = s.risultati.every(function (r) { return r.esito === "completato"; });
      s.stato = tutti && Date.now() <= s.scadenza ? "vinta" : "finita"; s.fine = Date.now();
    }
    scriviSfida(s); return s;
  }

  function vaiAvanti(s) {
    if (s.stato === "in_corso") location.href = urlGiocoSfida(s.giochi[s.indice]);
    else location.href = url("sfida/risultato/");
  }

  var orologio = null;
  function hudSfida() {
    if (!sfida.attiva()) return;
    var s = leggiSfida();
    if (!s.inizioGioco) { s.inizioGioco = Date.now(); scriviSfida(s); }
    document.body.classList.add("gs-in-sfida");       // nasconde i pulsanti data-gs-esercitazione
    var h = document.createElement("div");
    h.className = "gs-hud";
    h.setAttribute("role", "status");
    h.innerHTML = '<span>Sfida <b>' + testo((sfida.regole()[s.difficolta] || {}).nome || "") + '</b></span>' +
      '<span>Gioco <b>' + (s.indice + 1) + "</b> di <b>" + s.giochi.length + '</b></span>' +
      '<span class="gs-hud-tempo" aria-label="Tempo rimasto">' + mmss(s.scadenza - Date.now()) + '</span>' +
      '<span class="gs-spazio"></span>' +
      '<button type="button" data-azione="avanti" class="gs-nascosto">Prossimo gioco</button>' +
      '<button type="button" data-azione="salta">Salta</button><button type="button" data-azione="abbandona">Abbandona</button>';
    var barraEl = document.querySelector(".gs-barra");
    if (barraEl) barraEl.after(h); else document.body.prepend(h);
    var tempo = h.querySelector(".gs-hud-tempo");
    h.querySelector('[data-azione="salta"]').addEventListener("click", function () {
      dialogo({ titolo: "Saltare questo gioco?", testo: "Puoi andare avanti, ma la ricompensa arriva solo completando tutti i giochi.",
        azioni: [{ id: "no", etichetta: "Continua a giocare", secondario: true }, { id: "si", etichetta: "Salta" }] })
        .then(function (r) { if (r === "si") vaiAvanti(registra("saltato")); });
    });
    h.querySelector('[data-azione="abbandona"]').addEventListener("click", function () {
      dialogo({ titolo: "Abbandonare la sfida?", testo: "La sfida finisce qui e non potrai riprenderla.",
        azioni: [{ id: "no", etichetta: "Continua", secondario: true }, { id: "si", etichetta: "Abbandona" }] })
        .then(function (r) { if (r === "si") sfida.abbandona(); });
    });
    h.querySelector('[data-azione="avanti"]').addEventListener("click", function () { vaiAvanti(leggiSfida()); });
    var scaduta = false;
    function batti() {
      var resto = leggiSfida() ? leggiSfida().scadenza - Date.now() : 0;
      tempo.textContent = mmss(resto);
      tempo.classList.toggle("gs-poco", resto < 60000);
      if (resto <= 0 && !scaduta) {
        scaduta = true; clearInterval(orologio); chiudiSfida("scaduta");
        dialogo({ titolo: "Tempo scaduto!", testo: "Il tempo della sfida è finito. Vediamo com'è andata.", bloccante: true,
          azioni: [{ id: "ok", etichetta: "Vedi il risultato" }] }).then(function () { location.href = url("sfida/risultato/"); });
      }
    }
    batti(); orologio = setInterval(batti, 1000);
  }

  /* Da chiamare in ogni gioco quando la partita finisce.
     completato:false = partita persa (es. tempo del gioco scaduto).
     Nella sfida compare subito la finestra per passare al gioco successivo
     (ritardo: millisecondi per lasciar vedere l'ultima mossa). */
  function fineGioco(id, info) {
    info = info || {};
    document.dispatchEvent(new CustomEvent("giochisat:fine", { detail: { id: id, completato: info.completato !== false, punti: info.punti } }));
    if (!sfida.attiva()) return;
    var s = leggiSfida();
    setTimeout(function () {
      if (info.completato === false) {
        dialogo({ titolo: "Quasi!", testo: "Questo gioco non è stato completato. Puoi riprovare (il tempo della sfida continua a scorrere) oppure saltarlo.", bloccante: true,
          azioni: [{ id: "salta", etichetta: "Salta", secondario: true }, { id: "riprova", etichetta: "Riprova" }] })
          .then(function (r) { if (r === "salta") vaiAvanti(registra("saltato")); else if (r === "riprova") location.href = urlGiocoSfida(id); });
        return;
      }
      var dopo = registra("completato", info);
      clearInterval(orologio);
      var hud = document.querySelector(".gs-hud");
      if (hud) { var b = hud.querySelector('[data-azione="avanti"]'); b.classList.remove("gs-nascosto"); hud.querySelector('[data-azione="salta"]').classList.add("gs-nascosto"); }
      if (dopo.stato !== "in_corso") {
        dialogo({ titolo: dopo.stato === "vinta" ? "Sfida completata!" : "Hai finito i giochi",
          testo: "Hai concluso l'ultimo gioco della sfida.", bloccante: true, azioni: [{ id: "ok", etichetta: "Vedi il risultato" }] })
          .then(function (r) { if (r === "ok") location.href = url("sfida/risultato/"); });
        return;
      }
      var prossimo = gioco(dopo.giochi[dopo.indice]);
      var guadagnati = punti.conto(dopo).giochi[dopo.indice - 1];
      dialogo({ titolo: "Gioco completato!", testo: "+" + punti.formato(guadagnati) + " punti. Prossimo: " + prossimo.nome + " (gioco " + (dopo.indice + 1) + " di " + dopo.giochi.length + ").",
        bloccante: true, azioni: [{ id: "vai", etichetta: "Prossimo gioco" }] })
        .then(function () { vaiAvanti(dopo); });
    }, info.ritardo != null ? info.ritardo : 400);
  }

  /* ==================================================================
     Punti della Sfida (regole in config.js → punti)
       - ogni gioco completato vale il suo "valore"; nei giochi che contano
         le risposte (giuste/totale, o giuste/obiettivo) se ne prende la parte
       - sfida completata in tempo: punti per ogni minuto avanzato
       - tutto moltiplicato per la difficoltà
     I punti di ogni riga sono già moltiplicati: la somma fa il totale.
     ================================================================== */
  var punti = {
    regole: function () { return CFG.punti || {}; },
    moltiplicatore: function (d) { return (punti.regole().difficolta || {})[d] || 1; },
    /* punti di un gioco (prima della difficoltà) */
    gioco: function (r) {
      if (!r || r.esito !== "completato") return 0;
      var g = (punti.regole().giochi || {})[r.id] || {}, valore = g.valore || 0;
      var su = g.obiettivo || r.totale;
      if (r.giuste != null && su) valore *= Math.min(1, Math.max(0, r.giuste / su));
      return valore;
    },
    /* conto di una sfida: {giochi:[punti per gioco], minuti, tempo, moltiplicatore, totale} */
    conto: function (s) {
      var m = punti.moltiplicatore(s.difficolta);
      var giochiPunti = s.giochi.map(function (id, i) { return Math.round(punti.gioco(s.risultati[i]) * m); });
      var minuti = s.stato === "vinta" && s.fine ? Math.max(0, Math.floor((s.scadenza - s.fine) / 60000)) : 0;
      var tempo = Math.round(minuti * (punti.regole().minutoAvanzato || 0) * m);
      var totale = giochiPunti.reduce(function (a, b) { return a + b; }, 0) + tempo;
      return { giochi: giochiPunti, minuti: minuti, tempo: tempo, moltiplicatore: m, totale: totale };
    },
    /* 1134 → "1.134" */
    formato: function (n) { return Number(n || 0).toLocaleString("it-IT"); }
  };

  /* Se il tempo è scaduto mentre si era fuori da un gioco, chiude la sfida */
  function controllaScadenza() {
    var s = leggiSfida();
    if (s && s.stato === "in_corso" && Date.now() > s.scadenza) chiudiSfida("scaduta");
  }

  /* ==================================================================
     Icone ed elenco dei giochi (usati dalle pagine di Esercitazione)
     ================================================================== */
  var ICONE = {
    "memory": '<rect x="3" y="6" width="11" height="14" rx="2"/><rect x="10" y="3" width="11" height="14" rx="2"/>',
    "missione-satellite": '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M12 12l6-6"/>',
    "quiz-terra": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.1 1-1.1 1.8"/><path d="M12 17h.01"/>',
    "sensore-adatto": '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>',
    "puzzle-satelliti": '<path d="M5 8h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v3h-3a2 2 0 1 0-4 0H5v-3a2 2 0 1 0 0-4z"/>',
    "sat-doku": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    "parole-in-orbita": '<path d="M5 19 12 5l7 14M8 14h8"/>',
    "prato-stellato": '<path d="M12 3c.7 4.6 3.9 7.8 8.5 8.5-4.6.7-7.8 3.9-8.5 8.5-.7-4.6-3.9-7.8-8.5-8.5C8.1 10.8 11.3 7.6 12 3z"/>',
    "quizzone": '<circle cx="12" cy="12" r="2"/><path d="M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
    "duello-orbitale": '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 19c.8-3 2.6-5 5-5s4.2 2 5 5M11 19c.8-3 2.6-5 5-5s4.2 2 5 5"/>',
    "sensore-sfida": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'
  };
  function icona(id) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONE[id] || '<circle cx="12" cy="12" r="8"/>') + "</svg>";
  }
  var FRECCIA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  /* Riempie un <ul> con i giochi di un tipo ("single" o "multi").
     Per i giochi con più difficoltà, il clic apre prima la finestra di scelta;
     con ?gioco=<id> nell'indirizzo la finestra si apre subito per quel gioco. */
  function elencoGiochi(ul, tipo) {
    ul.innerHTML = giochi().filter(function (g) { return !tipo || g.tipo === tipo; }).map(function (g) {
      return '<li><a class="gs-gioco" href="' + url(g.percorso) + '" data-id="' + testo(g.id) + '" style="--c:' + testo(g.colore) + '">' +
        '<span class="gs-pallino">' + icona(g.id) + '</span><span><h3>' + testo(g.nome) + '</h3><p>' + testo(g.descrizione) + '</p></span>' +
        '<span class="gs-freccia">' + FRECCIA + "</span></a></li>";
    }).join("");
    ul.addEventListener("click", function (ev) {
      var a = ev.target.closest("a.gs-gioco");
      if (!a || !difficolta.ha(a.getAttribute("data-id")) || ev.button || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
      ev.preventDefault();
      difficolta.apri(a.getAttribute("data-id"));
    });
    var richiesto = new URLSearchParams(location.search).get("gioco");
    if (richiesto && difficolta.ha(richiesto) && ul.querySelector('[data-id="' + richiesto + '"]')) {
      history.replaceState(null, "", location.pathname);    // tornando indietro la finestra non si riapre
      difficolta.apri(richiesto);
    }
  }

  /* ==================================================================
     Avvio
     ================================================================== */
  function avvia() {
    controllaScadenza();
    cielo();
    barra();
    etichettaLivello();
    hudSfida();
  }
  var rimanda = richiediDifficolta();
  if (!rimanda) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();
  }

  window.GiochiSAT = {
    nome: nome, sfida: sfida, fineGioco: fineGioco, dialogo: dialogo,
    giochi: giochi, gioco: gioco, url: url, mmss: mmss, testo: testo, movimentoRidotto: movimentoRidotto,
    icona: icona, elencoGiochi: elencoGiochi, difficolta: difficolta, contoAllaRovescia: contoAllaRovescia,
    stella: STELLA, punti: punti
  };
})();
