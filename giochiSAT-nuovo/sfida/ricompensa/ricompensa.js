/* =====================================================================
   Ricompensa della modalità Sfida – DA COMPLETARE
   Questo file viene caricato dalla pagina sfida/ricompensa/ solo per
   chi ha vinto una sfida. Qui si decide cosa mostrare.

   esito contiene:
     nome        soprannome del giocatore
     difficolta  "facile" | "media" | "difficile"
     giochi      elenco degli id dei giochi della sfida
     risultati   [{id, esito, ms, punti}] per ogni gioco
     inizio/fine data di inizio e fine in millisecondi

   Le immagini e gli altri file della ricompensa vanno in
   assets/ricompense/ (vedi il LEGGIMI.md in quella cartella).

   Nota: il controllo "ha vinto" avviene nel browser, quindi chi sa usare
   gli strumenti per sviluppatori può aggirarlo. Va bene per un premio
   simbolico (attestato, badge); per premi fisici serve una verifica sul
   database.
   ===================================================================== */
window.GiochiSATRicompensa = {
  mostra: function (esito, contenitore) {
    // Esempio, da sostituire:
    // contenitore.innerHTML = '<img src="../../assets/ricompense/badge-' + esito.difficolta + '.png" alt="Badge">';
  }
};
