/* =====================================================================
   GiochiSAT – domande del Quizzone
   Legge assets/quiz/domande.txt (il formato è spiegato in cima al file)
   e pesca le domande di una partita. Lo usano:
     quiz-terra/            il gioco
     quiz-terra/controllo/  la pagina che controlla il file
   Da caricare dopo assets/js/giochisat.js.

     GiochiSATDomande.carica()                → Promise({ domande, errori })
     GiochiSATDomande.leggi(testo)            → { domande, errori }
     GiochiSATDomande.pesca(domande, quante)  → domande della partita
        quante = { facile: 3, normale: 2, difficile: 0 }
   ===================================================================== */
(function () {
  "use strict";

  var FILE = "assets/quiz/domande.txt";
  var LIVELLI = ["facile", "normale", "difficile"];
  var NOMI = { facile: "Facile", normale: "Normale", difficile: "Difficile" };
  /* se una difficoltà non ha abbastanza domande, si pesca da queste, in ordine */
  var VICINE = { facile: ["normale", "difficile"], normale: ["facile", "difficile"], difficile: ["normale", "facile"] };

  function nome(livello) { return NOMI[livello] || livello; }
  /* "facile" → "facili" quando n è diverso da 1 */
  function plurale(livello, n) { return Number(n) === 1 ? livello : livello.replace(/e$/, "i"); }

  function mescola(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  /* ---------- Lettura del file ---------------------------------------
       [facile] Testo della domanda      ← inizio di una domanda
       + risposta giusta
       - risposta sbagliata
       > spiegazione (facoltativa)
     Le domande scritte male vengono saltate e finiscono in "errori"
     con il numero di riga, così il gioco funziona comunque.            */
  function leggi(testo) {
    var domande = [], errori = [], d = null;

    function errore(riga, msg) { errori.push({ riga: riga, testo: msg }); }

    function chiudi() {
      if (!d) return;
      var n = d.risposte.length, giuste = d.risposte.filter(function (r) { return r.giusta; }).length;
      if (d.scarta) { /* errore già segnalato */ }
      else if (!d.testo) errore(d.riga, "manca il testo della domanda");
      else if (n < 2) errore(d.riga, "servono almeno 2 risposte");
      else if (n > 4) errore(d.riga, "al massimo 4 risposte (ce ne sono " + n + ")");
      else if (giuste === 0) errore(d.riga, "manca la risposta giusta: mettere + davanti");
      else if (giuste > 1) errore(d.riga, "c'è più di una risposta giusta (+)");
      else domande.push(d);
      d = null;
    }

    String(testo).replace(/^﻿/, "").split(/\r\n|\r|\n/).forEach(function (grezza, i) {
      var riga = i + 1, t = grezza.trim();
      if (!t || t.charAt(0) === "#") return;                              // righe vuote e note

      var inizio = t.match(/^\[([^\]]*)\]\s*(.*)$/);
      if (inizio) {                                                         // nuova domanda
        chiudi();
        var livello = inizio[1].trim().toLowerCase();
        if (livello === "media") livello = "normale";
        d = { riga: riga, livello: livello, testo: inizio[2].trim(), risposte: [], spiegazione: "" };
        if (LIVELLI.indexOf(livello) < 0) {
          d.scarta = true;
          errore(riga, 'difficoltà "' + inizio[1].trim() + '" sconosciuta: usare facile, normale o difficile');
        }
        return;
      }
      if (!d) { errore(riga, "riga fuori da una domanda: ogni domanda inizia con [facile], [normale] o [difficile]"); return; }

      var segno = t.charAt(0), resto = t.slice(1).trim();
      if (segno === "+" || segno === "-" || segno === "–") {
        if (resto) d.risposte.push({ testo: resto, giusta: segno === "+" });
        else errore(riga, "risposta vuota");
      } else if (segno === ">") {
        d.spiegazione += (d.spiegazione ? " " : "") + resto;
      } else if (!d.risposte.length && !d.spiegazione) {
        d.testo += (d.testo ? " " : "") + t;                                // domanda scritta su più righe
      } else {
        errore(riga, "riga non riconosciuta: le risposte iniziano con + o -, la spiegazione con >");
      }
    });
    chiudi();
    return { domande: domande, errori: errori };
  }

  /* ---------- Domande di una partita ----------------------------------
     Prima quelle della difficoltà richiesta, poi (se non bastano) quelle
     della difficoltà più vicina. Restituite dalla più facile alla più
     difficile; l'ordine delle risposte lo mescola il gioco.            */
  function pesca(domande, quante) {
    var gruppi = {}, scelte = [];
    LIVELLI.forEach(function (l) { gruppi[l] = mescola(domande.filter(function (d) { return d.livello === l; })); });
    LIVELLI.forEach(function (l) {
      var n = Number((quante || {})[l]) || 0;
      var prese = gruppi[l].splice(0, n);
      VICINE[l].forEach(function (v) { if (prese.length < n) prese = prese.concat(gruppi[v].splice(0, n - prese.length)); });
      scelte = scelte.concat(prese);
    });
    return scelte.sort(function (a, b) { return LIVELLI.indexOf(a.livello) - LIVELLI.indexOf(b.livello); });
  }

  /* ---------- Caricamento del file ------------------------------------
     no-cache: dopo una modifica su GitHub le domande nuove arrivano subito
     (il browser chiede comunque al sito se il file è cambiato).        */
  function carica() {
    return fetch(GiochiSAT.url(FILE), { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(leggi);
  }

  window.GiochiSATDomande = {
    FILE: FILE, LIVELLI: LIVELLI, nome: nome, plurale: plurale,
    leggi: leggi, pesca: pesca, mescola: mescola, carica: carica
  };
})();
