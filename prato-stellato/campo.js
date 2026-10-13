/* =====================================================================
   Prato stellato – regole del gioco
   Solo logica, nessun legame con la pagina: si può provare anche da sola.

   Il cielo è una griglia di colonne × righe caselle coperte. Alcune
   nascondono un detrito spaziale (luccica, ma non è una stella).
   - Scoprendo una casella senza detrito compare quanti detriti ci sono
     nelle 8 caselle intorno; se sono 0, le caselle vicine si scoprono da sole.
   - Una casella si può segnalare come "detrito avvistato".
   - Su un numero già scoperto, se intorno ci sono tante segnalazioni
     quanto il numero, si scoprono in un colpo le altre caselle vicine.
   - La prima casella scoperta non ha mai detriti, né intorno a sé:
     i detriti vengono messi solo dopo la prima mossa.
   - Si vince scoprendo tutte le caselle senza detrito; si perde
     scoprendo un detrito.

     const campo = new PratoStellato.Campo(colonne, righe, detriti);
     campo.scopri(i) / campo.segna(i) / campo.accorda(i)
       → elenco delle caselle cambiate (da ridisegnare)
     campo.esito  → null (in corso), "vinto" o "perso"
   ===================================================================== */
(function (globale) {
  "use strict";

  const COPERTA = "coperta", SCOPERTA = "scoperta", SEGNATA = "segnata";

  class Campo {
    /* casuale: funzione che restituisce un numero tra 0 e 1 (per le prove si può fissare) */
    constructor(colonne, righe, detriti, casuale = Math.random) {
      this.colonne = colonne;
      this.righe = righe;
      this.detriti = Math.max(1, Math.min(detriti, colonne * righe - 9));   // resta posto per la prima mossa
      this.casuale = casuale;
      this.celle = Array.from({ length: colonne * righe }, () => ({ detrito: false, vicini: 0, stato: COPERTA }));
      this.piazzati = false;
      this.esito = null;
      this.colpita = -1;                                   // casella del detrito scoperto per sbaglio
      this.daScoprire = colonne * righe - this.detriti;
    }

    get finito() { return this.esito !== null; }
    get segnate() { return this.celle.filter((c) => c.stato === SEGNATA).length; }
    /* detriti ancora da segnalare (può andare sotto zero se si segnala troppo) */
    get rimasti() { return this.detriti - this.segnate; }

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

    /* mette i detriti lontano dalla prima casella scoperta */
    piazza(primo) {
      let vietate = new Set([primo, ...this.vicine(primo)]);
      if (this.celle.length - vietate.size < this.detriti) vietate = new Set([primo]);
      const libere = [];
      this.celle.forEach((_, i) => { if (!vietate.has(i)) libere.push(i); });
      for (let k = libere.length - 1; k > 0; k--) {                      // mescola (Fisher–Yates)
        const j = Math.floor(this.casuale() * (k + 1));
        [libere[k], libere[j]] = [libere[j], libere[k]];
      }
      libere.slice(0, this.detriti).forEach((i) => { this.celle[i].detrito = true; });
      this.celle.forEach((cella, i) => {
        cella.vicini = this.vicine(i).filter((v) => this.celle[v].detrito).length;
      });
      this.piazzati = true;
    }

    /* scopre una casella coperta; se intorno non ci sono detriti allarga la scoperta */
    scopri(i) {
      if (this.finito || this.celle[i].stato !== COPERTA) return [];
      if (!this.piazzati) this.piazza(i);
      const cella = this.celle[i];
      if (cella.detrito) {
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
            if (this.celle[v].stato === COPERTA && !this.celle[v].detrito) { this.celle[v].stato = SCOPERTA; coda.push(v); }
          });
        }
      }
      this.daScoprire -= cambiate.length;
      if (this.daScoprire === 0) return cambiate.concat(this.vinci());
      return cambiate;
    }

    /* segnala o toglie la segnalazione da una casella coperta */
    segna(i) {
      const cella = this.celle[i];
      if (this.finito || cella.stato === SCOPERTA) return [];
      cella.stato = cella.stato === SEGNATA ? COPERTA : SEGNATA;
      return [i];
    }

    /* su un numero: se le segnalazioni intorno bastano, scopre le altre vicine */
    accorda(i) {
      const cella = this.celle[i];
      if (this.finito || cella.stato !== SCOPERTA || !cella.vicini) return [];
      const vicine = this.vicine(i);
      if (vicine.filter((v) => this.celle[v].stato === SEGNATA).length !== cella.vicini) return [];
      let cambiate = [];
      vicine.forEach((v) => { cambiate = cambiate.concat(this.scopri(v)); });
      return cambiate;
    }

    /* a fine partita vinta tutti i detriti risultano segnalati */
    vinci() {
      this.esito = "vinto";
      const segnate = [];
      this.celle.forEach((c, i) => { if (c.detrito && c.stato !== SEGNATA) { c.stato = SEGNATA; segnate.push(i); } });
      return segnate;
    }
  }

  const PratoStellato = { Campo, COPERTA, SCOPERTA, SEGNATA };
  if (typeof module !== "undefined" && module.exports) module.exports = PratoStellato;   // per le prove con node
  else globale.PratoStellato = PratoStellato;
})(typeof window !== "undefined" ? window : globalThis);
