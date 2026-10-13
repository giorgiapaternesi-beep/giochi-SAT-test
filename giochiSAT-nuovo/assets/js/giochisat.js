/* =====================================================================
   GiochiSAT – script comune a tutte le pagine
   Da caricare nell'<head>, subito dopo assets/config.js:
     <script src="../assets/config.js"></script>
     <script src="../assets/js/giochisat.js"></script>

   Offre window.GiochiSAT con:
     .nome      soprannome del giocatore (vale finché non si ricarica la pagina)
     .sfida     modalità Sfida (giochi estratti a caso + tempo limite)
     .fineGioco(id, {completato, punti, dettagli})  da chiamare a fine partita
     .dialogo({...})   finestra di dialogo comune
     .giochi()  catalogo dei giochi preso da config.js
     .url(p)    indirizzo assoluto partendo dalla radice del sito
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
  var STELLA_SVG = '<svg viewBox="-12 -12 24 24"><circle r="9" fill="currentColor" opacity=".16"/>' +
    '<path d="M0-12C.9-3.4 3.4-.9 12 0 3.4.9.9 3.4 0 12-.9 3.4-3.4.9-12 0-3.4-.9-.9-3.4 0-12Z" fill="currentColor"/></svg>';

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
    var colori = ["#FFF6D8", "#FFE59A", "#BFE3FF"];
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
    /* livello del gioco imposto dalla difficoltà (o null fuori dalla Sfida) */
    livello: function (id) {
      if (!sfida.attiva()) return null;
      var s = leggiSfida(), t = CFG.sfida && CFG.sfida.livelli && CFG.sfida.livelli[id];
      return t ? (t[s.difficolta] != null ? t[s.difficolta] : null) : null;
    },
    riprendi: function () { var s = leggiSfida(); if (s && s.stato === "in_corso") location.href = urlGiocoSfida(s.giochi[s.indice]); },
    abbandona: function () { chiudiSfida("abbandonata"); location.href = url("sfida/risultato/"); },
    /* chiude la sfida in corso senza cambiare pagina */
    annulla: function () { chiudiSfida("abbandonata"); },
    risultato: function () { return url("sfida/risultato/"); }
  };

  function chiudiSfida(stato) {
    var s = leggiSfida(); if (!s || s.stato !== "in_corso") return s;
    s.stato = stato; s.fine = Date.now(); scriviSfida(s); return s;
  }

  function registra(esito, info) {
    var s = leggiSfida(); if (!s || s.stato !== "in_corso") return s;
    var id = s.giochi[s.indice];
    s.risultati.push({ id: id, esito: esito, ms: s.inizioGioco ? Date.now() - s.inizioGioco : null, punti: info && info.punti != null ? info.punti : null });
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
     completato:false = partita persa (es. tempo del gioco scaduto). */
  function fineGioco(id, info) {
    info = info || {};
    document.dispatchEvent(new CustomEvent("giochisat:fine", { detail: { id: id, completato: info.completato !== false, punti: info.punti } }));
    if (!sfida.attiva()) return;
    var s = leggiSfida();
    setTimeout(function () {
      if (info.completato === false) {
        dialogo({ titolo: "Quasi!", testo: "Questo gioco non è stato completato. Puoi riprovare (il tempo della sfida continua a scorrere) oppure saltarlo.",
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
          testo: "Hai concluso l'ultimo gioco della sfida.", azioni: [{ id: "ok", etichetta: "Vedi il risultato" }] })
          .then(function (r) { if (r === "ok") location.href = url("sfida/risultato/"); });
        return;
      }
      var prossimo = gioco(dopo.giochi[dopo.indice]);
      dialogo({ titolo: "Gioco completato!", testo: "Prossimo: " + prossimo.nome + " (gioco " + (dopo.indice + 1) + " di " + dopo.giochi.length + ").",
        azioni: [{ id: "resta", etichetta: "Resta qui", secondario: true }, { id: "vai", etichetta: "Prossimo gioco" }] })
        .then(function (r) { if (r === "vai") vaiAvanti(dopo); });
    }, info.ritardo != null ? info.ritardo : 1200);
  }

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
    "quizzone": '<circle cx="12" cy="12" r="2"/><path d="M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
    "duello-orbitale": '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 19c.8-3 2.6-5 5-5s4.2 2 5 5M11 19c.8-3 2.6-5 5-5s4.2 2 5 5"/>',
    "sensore-sfida": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'
  };
  function icona(id) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONE[id] || '<circle cx="12" cy="12" r="8"/>') + "</svg>";
  }
  var FRECCIA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  /* Riempie un <ul> con i giochi di un tipo ("single" o "multi"). */
  function elencoGiochi(ul, tipo) {
    ul.innerHTML = giochi().filter(function (g) { return !tipo || g.tipo === tipo; }).map(function (g) {
      return '<li><a class="gs-gioco" href="' + url(g.percorso) + '" style="--c:' + testo(g.colore) + '">' +
        '<span class="gs-pallino">' + icona(g.id) + '</span><span><h3>' + testo(g.nome) + '</h3><p>' + testo(g.descrizione) + '</p></span>' +
        '<span class="gs-freccia">' + FRECCIA + "</span></a></li>";
    }).join("");
  }

  /* ==================================================================
     Avvio
     ================================================================== */
  function avvia() {
    controllaScadenza();
    cielo();
    barra();
    hudSfida();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();

  window.GiochiSAT = {
    nome: nome, sfida: sfida, fineGioco: fineGioco, dialogo: dialogo,
    giochi: giochi, gioco: gioco, url: url, mmss: mmss, testo: testo, movimentoRidotto: movimentoRidotto,
    icona: icona, elencoGiochi: elencoGiochi
  };
})();
