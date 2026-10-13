/* =====================================================================
   Prato stellato – regole del gioco
   Solo logica, nessun legame con la pagina: si può provare anche da sola.

   Il cielo è una griglia di colonne × righe caselle coperte. Alcune
   nascondono un satellite: luccica, ma non è una stella.
   - Scoprendo una casella senza satellite compare quanti satelliti ci
     sono nelle 8 caselle intorno; se sono 0, le vicine si scoprono da sole.
   - Dove si pensa che ci sia un satellite si mette una stella (segna).
   - Su un numero già scoperto, se intorno ci sono tante stelle quanto il
     numero, si scoprono in un colpo le altre caselle vicine (accorda).
   - La prima casella scoperta non ha mai satelliti, né intorno a sé:
     i satelliti vengono messi solo dopo la prima mossa.
   - Si vince scoprendo tutte le caselle senza satellite; si perde
     scoprendo un satellite.
   - Aiuto (suggerisci): indica una casella sicura che si può dedurre dai
     numeri; se non ce n'è nessuna (bisognerebbe tirare a indovinare)
     propone una casella sicura vicino alla zona già scoperta.

     const campo = new PratoStellato.Campo(colonne, righe, satelliti);
     campo.scopri(i) / campo.segna(i) / campo.accorda(i)
       → elenco delle caselle cambiate (da ridisegnare)
     campo.suggerisci() → { i, certa } oppure null
     campo.esito        → null (in corso), "vinto" o "perso"
   ===================================================================== */
(function (globale) {
  "use strict";

  const COPERTA = "coperta", SCOPERTA = "scoperta", SEGNATA = "segnata";

  class Campo {
    /* casuale: funzione che restituisce un numero tra 0 e 1 (per le prove si può fissare) */
    constructor(colonne, righe, satelliti, casuale = Math.random) {
      this.colonne = colonne;
      this.righe = righe;
      this.satelliti = Math.max(1, Math.min(satelliti, colonne * righe - 9));   // resta posto per la prima mossa
      this.casuale = casuale;
      this.celle = Array.from({ length: colonne * righe }, () => ({ satellite: false, vicini: 0, stato: COPERTA }));
      this.piazzati = false;
      this.esito = null;
      this.colpita = -1;                                   // satellite scoperto per sbaglio
      this.daScoprire = colonne * righe - this.satelliti;
    }

    get finito() { return this.esito !== null; }
    get segnate() { return this.celle.filter((c) => c.stato === SEGNATA).length; }
    /* satelliti ancora da segnare (può andare sotto zero se si mettono troppe stelle) */
    get rimasti() { return this.satelliti - this.segnate; }

    riga(i) { return Math.floor(i / this.colonne); }
    colonna(i) { return i % this.colonne; }

    /* le (fino a) 8 caselle intorno alla casella i */
    vicine(i) {
      const r = this.riga(i), c = this.colonna(i), elenco = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if ((dr || dc) && rr >= 0 && rr < this.righe && cc >= 0 && cc < this.colonne) elenco.push(rr * this.colonne + cc);
        }
      }
      return elenco;
    }

    /* mette i satelliti lontano dalla prima casella scoperta */
    piazza(primo) {
      let vietate = new Set([primo, ...this.vicine(primo)]);
      if (this.celle.length - vietate.size < this.satelliti) vietate = new Set([primo]);
      const libere = [];
      this.celle.forEach((_, i) => { if (!vietate.has(i)) libere.push(i); });
      mescola(libere, this.casuale);
      libere.slice(0, this.satelliti).forEach((i) => { this.celle[i].satellite = true; });
      this.celle.forEach((cella, i) => {
        cella.vicini = this.vicine(i).filter((v) => this.celle[v].satellite).length;
      });
      this.piazzati = true;
    }

    /* scopre una casella coperta; se intorno non ci sono satelliti allarga la scoperta */
    scopri(i) {
      if (this.finito || this.celle[i].stato !== COPERTA) return [];
      if (!this.piazzati) this.piazza(i);
      const cella = this.celle[i];
      if (cella.satellite) {
        cella.stato = SCOPERTA;
        this.colpita = i;
        this.esito = "perso";
        return [i];
      }
      const cambiate = [], coda = [i];
      cella.stato = SCOPERTA;
      while (coda.length) {
        const j = coda.shift();
        cambiate.push(j);
        if (this.celle[j].vicini === 0) {
          this.vicine(j).forEach((v) => {
            if (this.celle[v].stato === COPERTA) { this.celle[v].stato = SCOPERTA; coda.push(v); }
          });
        }
      }
      this.daScoprire -= cambiate.length;
      if (this.daScoprire === 0) return cambiate.concat(this.vinci());
      return cambiate;
    }

    /* mette o toglie la stella su una casella coperta */
    segna(i) {
      const cella = this.celle[i];
      if (this.finito || cella.stato === SCOPERTA) return [];
      cella.stato = cella.stato === SEGNATA ? COPERTA : SEGNATA;
      return [i];
    }

    /* su un numero: se le stelle intorno bastano, scopre le altre vicine */
    accorda(i) {
      const cella = this.celle[i];
      if (this.finito || cella.stato !== SCOPERTA || !cella.vicini) return [];
      const vicine = this.vicine(i);
      if (vicine.filter((v) => this.celle[v].stato === SEGNATA).length !== cella.vicini) return [];
      let cambiate = [];
      vicine.forEach((v) => { cambiate = cambiate.concat(this.scopri(v)); });
      return cambiate;
    }

    /* a partita vinta su ogni satellite c'è una stella */
    vinci() {
      this.esito = "vinto";
      const segnate = [];
      this.celle.forEach((c, i) => { if (c.satellite && c.stato !== SEGNATA) { c.stato = SEGNATA; segnate.push(i); } });
      return segnate;
    }

    /* ---------- Aiuto -------------------------------------------------
       Ragiona come un giocatore, usando solo i numeri scoperti (non le
       stelle messe dal giocatore, che potrebbero essere sbagliate):
       { i, certa: true }  casella che si può dedurre sicura dai numeri;
       { i, certa: false } nessuna deduzione possibile: casella sicura
                           vicino alla zona scoperta, da scoprire per lui;
       null                partita non iniziata o finita.               */
    suggerisci() {
      if (!this.piazzati || this.finito) return null;
      const sicure = this.deduciSicure();
      const ancoraCoperte = sicure.filter((i) => this.celle[i].stato === COPERTA);
      if (ancoraCoperte.length) return { i: ancoraCoperte[Math.floor(this.casuale() * ancoraCoperte.length)], certa: true };

      // nessuna mossa certa: una casella senza satellite, possibilmente accanto a un numero
      const libere = [];
      this.celle.forEach((c, i) => { if (!c.satellite && c.stato !== SCOPERTA) libere.push(i); });
      const vicinoAiNumeri = libere.filter((i) => this.vicine(i).some((v) => this.celle[v].stato === SCOPERTA));
      const scelta = vicinoAiNumeri.length ? vicinoAiNumeri : libere;
      return scelta.length ? { i: scelta[Math.floor(this.casuale() * scelta.length)], certa: false } : null;
    }

    /* caselle non scoperte che i numeri dimostrano senza satellite */
    deduciSicure() {
      const noto = new Map();                                   // casella → true (satellite) / false (sicura)
      const vincoli = [];                                       // un vincolo per ogni numero scoperto
      this.celle.forEach((c, i) => {
        if (c.stato !== SCOPERTA || c.satellite) return;
        const ignote = this.vicine(i).filter((v) => this.celle[v].stato !== SCOPERTA);
        if (ignote.length) vincoli.push({ celle: ignote, quanti: c.vicini });
      });

      /* toglie da un vincolo le caselle già note */
      const riduci = (v) => {
        const celle = v.celle.filter((x) => !noto.has(x));
        const quanti = v.quanti - v.celle.filter((x) => noto.get(x) === true).length;
        return { celle, quanti };
      };
      const fissa = (celle, valore) => {
        let nuove = false;
        celle.forEach((x) => { if (!noto.has(x)) { noto.set(x, valore); nuove = true; } });
        return nuove;
      };

      let cambiato = true;
      while (cambiato) {
        cambiato = false;
        const ridotti = vincoli.map(riduci).filter((v) => v.celle.length);
        // regola 1: un numero già "pieno" o con tante caselle quanti satelliti
        for (const v of ridotti) {
          if (v.quanti === 0) cambiato = fissa(v.celle, false) || cambiato;
          else if (v.quanti === v.celle.length) cambiato = fissa(v.celle, true) || cambiato;
        }
        if (cambiato) continue;
        // regola 2: se le caselle di un numero sono tutte tra quelle di un altro,
        // le caselle in più contengono esattamente la differenza dei due numeri
        for (const a of ridotti) {
          for (const b of ridotti) {
            if (a === b || a.celle.length >= b.celle.length || !a.celle.every((x) => b.celle.includes(x))) continue;
            const resto = b.celle.filter((x) => !a.celle.includes(x)), diff = b.quanti - a.quanti;
            if (diff === 0) cambiato = fissa(resto, false) || cambiato;
            else if (diff === resto.length) cambiato = fissa(resto, true) || cambiato;
          }
        }
      }
      const sicure = [];
      noto.forEach((satellite, i) => { if (!satellite) sicure.push(i); });
      return sicure;
    }
  }

  function mescola(a, casuale) {                               // Fisher–Yates
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(casuale() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  }

  const PratoStellato = { Campo, COPERTA, SCOPERTA, SEGNATA };
  if (typeof module !== "undefined" && module.exports) module.exports = PratoStellato;   // per le prove con node
  else globale.PratoStellato = PratoStellato;
})(typeof window !== "undefined" ? window : globalThis);
