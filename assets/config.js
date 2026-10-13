/* =====================================================================
   GiochiSAT – configurazione comune
   Unico file da modificare per: database, elenco dei giochi, regole
   della modalità Sfida, video della Terra.
   ===================================================================== */
window.GIOCHISAT_CONFIG = Object.freeze({

  /* --- Database (Supabase) -------------------------------------------
     La chiave "publishable" è pensata per pagine pubbliche: la sicurezza
     dei dati dipende dalle regole (RLS) e dalle funzioni in Supabase. */
  supabaseUrl: "https://tbjbtghzzqfximtjhutk.supabase.co",
  supabaseKey: "sb_publishable_uzkoqY4PTm6VSd1fugUuPQ_VHb-wEVS",

  /* --- Catalogo dei giochi -------------------------------------------
     tipo: "single" = un giocatore (entra nella Sfida e in Esercitazione)
           "multi"  = più giocatori (solo in Esercitazione)
     colore: usato per pallini, bordi e pulsanti del gioco. */
  giochi: [
    { id: "memory",             nome: "Memory Match",        tipo: "single", colore: "#4F7DFF", percorso: "memory/",
      descrizione: "Trova le coppie di immagini prima che finisca il tempo." },
    { id: "missione-satellite", nome: "Missione satellite",  tipo: "single", colore: "#FF5C8A", percorso: "missione-satellite/",
      descrizione: "Leggi i dati del satellite e scopri quale problema nascondono." },
    { id: "quiz-terra",         nome: "Osserva la Terra",    tipo: "single", colore: "#2ED3A0", percorso: "quiz-terra/",
      descrizione: "Otto domande su come i satelliti studiano il pianeta." },
    { id: "sensore-adatto",     nome: "Il sensore giusto",   tipo: "single", colore: "#FFB238", percorso: "sensore-adatto/",
      descrizione: "Incendi, alluvioni, frane: scegli il sensore adatto e puntalo." },
    { id: "puzzle-satelliti",   nome: "Puzzle della Terra",  tipo: "single", colore: "#FF6B4A", percorso: "puzzle-satelliti/",
      descrizione: "Ricomponi l'immagine della Terra vista dai satelliti." },
    { id: "sat-doku",           nome: "SAT-Doku",            tipo: "single", colore: "#29C7D9", percorso: "sat-doku/",
      descrizione: "Un satellite per riga, colonna e area, senza interferenze." },
    { id: "parole-in-orbita",   nome: "Parole in orbita",    tipo: "single", colore: "#C77DFF", percorso: "parole-in-orbita/",
      descrizione: "Collega le lettere e trova le parole dell'ambiente." },

    { id: "quizzone",           nome: "Quizzone Live",       tipo: "multi",  colore: "#9B7BFF", percorso: "quizzone/",
      descrizione: "Tutti insieme durante gli eventi: cinque domande e risultati in diretta." },
    { id: "duello-orbitale",    nome: "Duello orbitale",     tipo: "multi",  colore: "#FF8A3D", percorso: "duello-orbitale/",
      descrizione: "In due sullo stesso schermo: chi inquadra prima l'evento?" },
    { id: "sensore-sfida",      nome: "Sfida del sensore",   tipo: "multi",  colore: "#FFC93C", percorso: "sensore-sfida/",
      descrizione: "Sfida online un'altra persona su sei problemi ambientali." }
  ],

  /* --- Modalità Sfida ------------------------------------------------
     giochi: quanti giochi "single" vengono estratti a caso.
     minuti: tempo totale per completarli tutti.
     VALORI DA PLAY TESTING: tutti i giochi e tempo abbondante.
     Abbassarli quando si saranno misurati i tempi reali. */
  sfida: {
    difficolta: {
      facile:    { nome: "Facile",    giochi: 7, minuti: 60, descrizione: "Livelli base e tempi larghi nei giochi." },
      media:     { nome: "Media",     giochi: 7, minuti: 60, descrizione: "Un po' più di pepe: tempi più stretti." },
      difficile: { nome: "Difficile", giochi: 7, minuti: 60, descrizione: "Livelli avanzati e tempi stretti." }
    },
    /* Livello che ogni gioco usa durante la Sfida, per difficoltà. */
    livelli: {
      "memory":           { facile: 90,     media: 60,     difficile: 30 },          // secondi
      "sat-doku":         { facile: "base", media: "base", difficile: "advanced" },
      "parole-in-orbita": { facile: "base", media: "advanced", difficile: "advanced" }
    }
  },

  /* --- Terra animata in home -----------------------------------------
     null = Terra disegnata in CSS (leggerissima).
     Per usare un video: caricarlo in assets/terra/ e scrivere qui il
     percorso, per esempio "assets/terra/terra.webm". */
  terraVideo: null
});
