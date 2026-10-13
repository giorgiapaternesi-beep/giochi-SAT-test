/* =====================================================================
   Prato stellato – interfaccia
   Disegna il campo e gestisce tocchi, clic, tastiera, tempo ed esito.
   Le regole sono in campo.js; dimensioni del campo e detriti per ogni
   difficoltà in assets/config.js (livelli → "prato-stellato").

   Comandi
     tocco / clic / Invio      scopre la casella (su un numero: scopre le
                               vicine se i suoi detriti sono già segnalati)
     pressione lunga / clic destro / tasto F   segnala un detrito
     pulsante "Segnala"        il tocco segnala invece di scoprire
     frecce                    si muove tra le caselle
   ===================================================================== */
(function () {
  "use strict";

  const ID = "prato-stellato";
  const { Campo, COPERTA, SCOPERTA, SEGNATA } = window.PratoStellato;
  const LIVELLO = GiochiSAT.difficolta.parametri(ID) || { colonne: 12, righe: 9, detriti: 18 };

  const PRESSIONE_LUNGA = 400;          // millisecondi per segnalare tenendo premuto
  const CELLA_MIN = 30, CELLA_MAX = 44; // lato delle caselle in pixel (sotto i 30 il dito non ci sta)
  const LUCCICHIO = 0.12;               // quota di caselle coperte che brillano (solo decorazione)

  const ICONA = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ps-icona-${id}"/></svg>`;
  const $ = (id) => document.getElementById(id);
  const campoEl = $("campo");

  let campo = null;                     // partita in corso (campo.js)
  let celle = [];                       // pulsanti delle caselle
  let attiva = 0;                       // casella raggiungibile con il tasto Tab
  let modoSegna = false;
  let inizio = 0, orologio = null;

  /* ---------- Partita ---------------------------------------------- */
  function nuovaPartita() {
    fermaTempo();
    inizio = 0;
    // sul telefono in verticale il campo si gira, così le caselle restano grandi
    const verticale = innerHeight > innerWidth;
    const [colonne, righe] = verticale && LIVELLO.colonne > LIVELLO.righe
      ? [LIVELLO.righe, LIVELLO.colonne] : [LIVELLO.colonne, LIVELLO.righe];
    campo = new Campo(colonne, righe, LIVELLO.detriti);
    costruisci();
    $("tempo").textContent = formatta(0);
    $("esito").hidden = true;
    campoEl.classList.remove("ps-finito");
    aggiornaContatore();
    dimensiona();
  }

  function costruisci() {
    campoEl.style.setProperty("--colonne", campo.colonne);
    campoEl.setAttribute("aria-label", `Cielo da esplorare: ${campo.colonne} colonne per ${campo.righe} righe`);
    const frammento = document.createDocumentFragment();
    celle = campo.celle.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ps-cella";
      b.dataset.i = i;
      b.tabIndex = i === 0 ? 0 : -1;
      if (Math.random() < LUCCICHIO) {                       // non tutto quello che luccica è una stella
        b.classList.add("ps-luccica");
        b.style.setProperty("--ritardo", (-Math.random() * 3).toFixed(2) + "s");
      }
      frammento.appendChild(b);
      return b;
    });
    campoEl.replaceChildren(frammento);
    attiva = 0;
    celle.forEach((_, i) => disegna(i));
  }

  /* ---------- Disegno di una casella ------------------------------- */
  function disegna(i) {
    const c = campo.celle[i], el = celle[i];
    const perso = campo.esito === "perso";
    const mostraDetrito = c.detrito && (c.stato === SCOPERTA || (perso && c.stato !== SEGNATA));
    const sbagliata = perso && c.stato === SEGNATA && !c.detrito;
    el.classList.toggle("ps-scoperta", c.stato === SCOPERTA || mostraDetrito);
    el.classList.toggle("ps-segnata", c.stato === SEGNATA);
    el.classList.toggle("ps-colpita", i === campo.colpita);
    el.classList.toggle("ps-sbagliata", sbagliata);
    el.dataset.n = c.stato === SCOPERTA && !c.detrito && c.vicini ? c.vicini : "";

    let descrizione;
    if (mostraDetrito) { el.innerHTML = ICONA("detrito"); descrizione = "detrito spaziale"; }
    else if (c.stato === SEGNATA) { el.innerHTML = ICONA("mirino"); descrizione = sbagliata ? "segnalata, ma non era un detrito" : "segnalata come detrito"; }
    else if (c.stato === SCOPERTA) {
      el.textContent = c.vicini || "";
      descrizione = c.vicini ? `${c.vicini} ${c.vicini === 1 ? "detrito" : "detriti"} intorno` : "vuota";
    } else { el.textContent = ""; descrizione = "coperta"; }
    el.setAttribute("aria-label", `Riga ${campo.riga(i) + 1}, colonna ${campo.colonna(i) + 1}: ${descrizione}`);
  }

  /* ---------- Azioni ------------------------------------------------ */
  function azione(i) {
    const c = campo.celle[i];
    if (c.stato === SCOPERTA) applica(campo.accorda(i));
    else if (modoSegna) segna(i);
    else applica(campo.scopri(i));
  }

  function segna(i) {
    if (applica(campo.segna(i)).length && navigator.vibrate) navigator.vibrate(25);
  }

  /* ridisegna le caselle cambiate e controlla se la partita è finita */
  function applica(cambiate) {
    if (!cambiate.length) return cambiate;
    if (!inizio && campo.piazzati) avviaTempo();
    cambiate.forEach(disegna);
    aggiornaContatore();
    if (campo.finito) fine();
    return cambiate;
  }

  function aggiornaContatore() { $("rimasti").textContent = campo.rimasti; }

  /* ---------- Tempo ------------------------------------------------- */
  function formatta(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function avviaTempo() {
    inizio = Date.now();
    if (window.GiochiSATStats) window.GiochiSATStats.recordPlay(ID);
    orologio = setInterval(() => { $("tempo").textContent = formatta(Date.now() - inizio); }, 250);
  }
  function fermaTempo() {
    clearInterval(orologio);
    orologio = null;
    return inizio ? Date.now() - inizio : 0;
  }

  /* ---------- Fine partita ------------------------------------------ */
  function fine() {
    const ms = fermaTempo();
    const vinto = campo.esito === "vinto";
    $("tempo").textContent = formatta(ms);
    campoEl.classList.add("ps-finito");
    if (!vinto) campo.celle.forEach((c, i) => { if (c.detrito || c.stato === SEGNATA) disegna(i); });   // mostra dove erano

    $("esito").className = "ps-scheda ps-esito " + (vinto ? "ps-vinto" : "ps-perso");
    $("esito-titolo").textContent = vinto ? "Cielo mappato!" : "Ops! Era un detrito spaziale";
    $("esito-testo").textContent = vinto
      ? `Hai trovato tutti i ${campo.detriti} detriti in ${formatta(ms)}.`
      : "Quella luce non era una stella. Riprova: la prima casella che scopri è sempre sicura.";
    $("esito").hidden = false;
    $("esito").scrollIntoView({ behavior: GiochiSAT.movimentoRidotto ? "auto" : "smooth", block: "nearest" });

    // nella sfida: vinto → prossimo gioco; perso → Riprova o Salta (dopo aver visto il campo)
    GiochiSAT.fineGioco(ID, vinto ? { punti: ms } : { completato: false, ritardo: 900 });
  }

  /* ---------- Dimensione delle caselle ------------------------------
     Il campo deve stare nello schermo: si usa la larghezza della scheda e
     l'altezza libera sotto il campo (lasciando posto alla didascalia).
     Se lo schermo è troppo basso (telefono in orizzontale) si scorre. */
  function dimensiona() {
    if (!campo) return;
    const scheda = campoEl.closest(".ps-scheda"), stile = getComputedStyle(scheda);
    const spazio = parseFloat(getComputedStyle(campoEl).columnGap) || 0;
    const larghezza = scheda.clientWidth - parseFloat(stile.paddingLeft) - parseFloat(stile.paddingRight);
    const sotto = document.querySelector(".ps-didascalia").offsetHeight + 28;
    const altezza = innerHeight - (campoEl.getBoundingClientRect().top + scrollY) - sotto;
    const perLarghezza = (larghezza - spazio * (campo.colonne - 1)) / campo.colonne;
    const perAltezza = (altezza - spazio * (campo.righe - 1)) / campo.righe;
    const lato = Math.floor(Math.min(perLarghezza, Math.max(perAltezza, CELLA_MIN), CELLA_MAX));
    campoEl.style.setProperty("--cella", lato + "px");
  }

  /* ---------- Tocchi, clic e tastiera ------------------------------- */
  let pressione = null;                 // pressione lunga in corso (dito o penna)
  let ignoraClic = false;               // il clic che segue una pressione lunga non scopre
  let ultimoPuntatore = "mouse";

  function cellaDa(evento) {
    const el = evento.target.closest(".ps-cella");
    return el && !campo.finito ? Number(el.dataset.i) : -1;
  }
  function annullaPressione() {
    if (pressione) clearTimeout(pressione.timer);
    pressione = null;
  }

  campoEl.addEventListener("pointerdown", (e) => {
    ultimoPuntatore = e.pointerType;
    ignoraClic = false;
    const i = cellaDa(e);
    if (i < 0 || e.pointerType === "mouse") return;            // col mouse si segnala con il tasto destro
    pressione = {
      x: e.clientX, y: e.clientY,
      timer: setTimeout(() => { pressione = null; ignoraClic = true; segna(i); }, PRESSIONE_LUNGA)
    };
  });
  campoEl.addEventListener("pointermove", (e) => {
    if (pressione && Math.hypot(e.clientX - pressione.x, e.clientY - pressione.y) > 10) annullaPressione();
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((tipo) => campoEl.addEventListener(tipo, annullaPressione));

  campoEl.addEventListener("click", (e) => {
    const i = cellaDa(e);
    if (i < 0) return;
    if (ignoraClic) { ignoraClic = false; return; }
    sposta(i, false);
    azione(i);
  });

  campoEl.addEventListener("contextmenu", (e) => {
    if (!e.target.closest(".ps-cella")) return;
    e.preventDefault();                                          // niente menu del browser sul campo
    const i = cellaDa(e);
    if (i >= 0 && ultimoPuntatore === "mouse") segna(i);         // sul telefono ci pensa la pressione lunga
  });

  const FRECCE = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  campoEl.addEventListener("keydown", (e) => {
    const el = e.target.closest(".ps-cella");
    if (!el) return;
    const i = Number(el.dataset.i);
    if (FRECCE[e.key]) {
      e.preventDefault();
      const r = Math.min(campo.righe - 1, Math.max(0, campo.riga(i) + FRECCE[e.key][0]));
      const c = Math.min(campo.colonne - 1, Math.max(0, campo.colonna(i) + FRECCE[e.key][1]));
      sposta(r * campo.colonne + c, true);
    } else if ((e.key === "f" || e.key === "F") && !campo.finito) {
      e.preventDefault();
      segna(i);
    }
  });

  /* la casella i diventa quella raggiungibile con Tab */
  function sposta(i, fuoco) {
    celle[attiva].tabIndex = -1;
    attiva = i;
    celle[i].tabIndex = 0;
    if (fuoco) celle[i].focus();
  }

  $("modo").addEventListener("click", () => {
    modoSegna = !modoSegna;
    $("modo").setAttribute("aria-pressed", String(modoSegna));
    campoEl.classList.toggle("ps-modo-segna", modoSegna);
  });
  $("nuova").addEventListener("click", nuovaPartita);
  $("ancora").addEventListener("click", () => { nuovaPartita(); window.scrollTo({ top: 0 }); });
  addEventListener("resize", dimensiona);
  addEventListener("load", dimensiona);                          // dopo i font, le misure sono definitive

  nuovaPartita();
})();
