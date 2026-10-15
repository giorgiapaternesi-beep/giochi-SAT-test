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
    { id: "quiz-terra",         nome: "Quizzone",            tipo: "single", colore: "#2ED3A0", percorso: "quiz-terra/",
      descrizione: "Cinque domande a sorpresa su satelliti e ambiente." },
    { id: "sensore-adatto",     nome: "Il sensore giusto",   tipo: "single", colore: "#FFB238", percorso: "sensore-adatto/",
      descrizione: "Incendi, alluvioni, frane: scegli il sensore adatto e puntalo." },
    { id: "puzzle-satelliti",   nome: "Puzzle della Terra",  tipo: "single", colore: "#FF6B4A", percorso: "puzzle-satelliti/",
      descrizione: "Ricomponi l'immagine della Terra vista dai satelliti." },
    { id: "sat-doku",           nome: "SAT-Doku",            tipo: "single", colore: "#29C7D9", percorso: "sat-doku/",
      descrizione: "Un satellite per riga, colonna e area: mai vicini, nemmeno in diagonale." },
    { id: "parole-in-orbita",   nome: "Parole in orbita",    tipo: "single", colore: "#C77DFF", percorso: "parole-in-orbita/",
      descrizione: "Collega le lettere e trova le parole dell'ambiente." },
    { id: "prato-stellato",     nome: "Prato stellato",      tipo: "single", colore: "#9BE15D", percorso: "prato-stellato/",
      descrizione: "Non tutto quello che luccica è una stella." },

    { id: "quizzone",           nome: "Quizzone Live",       tipo: "multi",  colore: "#9B7BFF", percorso: "quizzone/",
      descrizione: "Tutti insieme durante gli eventi: cinque domande e risultati in diretta." },
    { id: "duello-orbitale",    nome: "Duello orbitale",     tipo: "multi",  colore: "#FF8A3D", percorso: "duello-orbitale/",
      descrizione: "In due sullo stesso schermo: chi inquadra prima l'evento?" },
    { id: "sensore-sfida",      nome: "Sfida del sensore",   tipo: "multi",  colore: "#FFC93C", percorso: "sensore-sfida/",
      descrizione: "Sfida online un'altra persona su sei problemi ambientali." }
  ],

  /* --- Difficoltà ----------------------------------------------------
     Ogni gioco singleplayer ha tre difficoltà. In Esercitazione si sceglie
     in cima al gioco; nella Sfida si sceglie una volta sola all'inizio e
     vale per tutti i giochi. Qui sotto cosa cambia per ogni gioco. */
  difficolta: {
    facile:    { nome: "Facile" },
    media:     { nome: "Media" },
    difficile: { nome: "Difficile" }
  },
  livelli: {
    "memory": {                       // coppie da trovare e secondi a disposizione
      facile:    { coppie: 6, secondi: 90, descrizione: "6 coppie, 90 secondi" },
      media:     { coppie: 8, secondi: 60, descrizione: "8 coppie, 60 secondi" },
      difficile: { coppie: 8, secondi: 30, descrizione: "8 coppie, 30 secondi" }
    },
    "missione-satellite": {           // risposte tra cui scegliere; secondi per anomalia (0 = senza tempo)
      facile:    { opzioni: 2, secondi: 0,  descrizione: "2 risposte possibili, senza tempo" },
      media:     { opzioni: 3, secondi: 0,  descrizione: "3 risposte possibili, senza tempo" },
      difficile: { opzioni: 3, secondi: 20, descrizione: "3 risposte, 20 secondi per anomalia" }
    },
    "quiz-terra": {                   // Quizzone: domande pescate per difficoltà (file assets/quiz/domande.txt); secondi per domanda (0 = senza tempo)
      facile:    { domande: { facile: 3, normale: 2 },               secondi: 0,  descrizione: "3 domande facili e 2 normali, senza tempo" },
      media:     { domande: { facile: 1, normale: 3, difficile: 1 }, secondi: 30, descrizione: "1 facile, 3 normali e 1 difficile, 30 secondi a domanda" },
      difficile: { domande: { normale: 2, difficile: 3 },            secondi: 15, descrizione: "2 domande normali e 3 difficili, 15 secondi a domanda" }
    },
    "sensore-adatto": {               // precisione richiesta per centrare il problema; aiuto = il bersaglio si illumina
      facile:    { tolleranza: 44, aiuto: true,  descrizione: "Mira facile, con aiuto" },
      media:     { tolleranza: 30, aiuto: true,  descrizione: "Mira normale, con aiuto" },
      difficile: { tolleranza: 18, aiuto: false, descrizione: "Mira precisa, senza aiuto" }
    },
    "puzzle-satelliti": {             // pezzi del puzzle: colonne x righe
      facile:    { colonne: 4, righe: 3, descrizione: "12 pezzi" },
      media:     { colonne: 5, righe: 4, descrizione: "20 pezzi" },
      difficile: { colonne: 6, righe: 5, descrizione: "30 pezzi" }
    },
    "sat-doku": {                     // griglia "base" 4x4 o "advanced" 5x5
      facile:    { griglia: "base",     suggerimenti: true,  descrizione: "Griglia 4×4, suggerimenti attivi" },
      media:     { griglia: "advanced", suggerimenti: true,  descrizione: "Griglia 5×5, suggerimenti attivi" },
      difficile: { griglia: "advanced", suggerimenti: false, descrizione: "Griglia 5×5, senza suggerimenti" }
    },
    "parole-in-orbita": {             // griglia "base" 4x4 o "advanced" 5x5 e secondi
      facile:    { griglia: "base",     secondi: 120, descrizione: "Griglia 4×4, 120 secondi" },
      media:     { griglia: "base",     secondi: 90,  descrizione: "Griglia 4×4, 90 secondi" },
      difficile: { griglia: "advanced", secondi: 120, descrizione: "Griglia 5×5, 120 secondi" }
    },
    "prato-stellato": {               // campo colonne × righe e satelliti nascosti (sul telefono in verticale il campo si gira)
      facile:    { colonne: 8,  righe: 8,  satelliti: 10, descrizione: "Campo 8×8, 10 satelliti" },
      media:     { colonne: 12, righe: 9,  satelliti: 18, descrizione: "Campo 12×9, 18 satelliti" },
      difficile: { colonne: 16, righe: 10, satelliti: 30, descrizione: "Campo 16×10, 30 satelliti" }
    }
  },
  difficoltaPredefinita: "media",

  /* --- Modalità Sfida ------------------------------------------------
     giochi: quanti giochi "single" vengono estratti a caso.
     minuti: tempo totale per completarli tutti.
     VALORI DA PLAY TESTING: tutti i giochi e tempo abbondante.
     Abbassarli quando si saranno misurati i tempi reali. */
  sfida: {
    difficolta: {
      facile:    { nome: "Facile",    giochi: 8, minuti: 60, descrizione: "Pochi pezzi e coppie, domande facili, tempi larghi e nessun conto alla rovescia nei quiz." },
      media:     { nome: "Media",     giochi: 8, minuti: 60, descrizione: "Griglie più grandi, domande un po' più impegnative e un po' di tempo nei quiz." },
      difficile: { nome: "Difficile", giochi: 8, minuti: 60, descrizione: "Tanti pezzi, domande difficili, tempi stretti e nessun aiuto." }
    }
  },

  /* --- Memory: immagine del retro delle carte (segnaposto da sostituire) */
  memory: { retro: "assets/memory/retro.svg" },

  /* --- Puzzle: immagini tra cui viene scelta quella da ricomporre.
     file: null = il disegno originale del gioco. Le altre vanno in
     assets/puzzle/ e vengono ritagliate in formato 5:4 (es. 1000x800). */
  puzzle: {
    immagini: [
      { file: null,                           titolo: "la Terra vista dai satelliti Sentinel-2" },
      { file: "assets/puzzle/costa.svg",      titolo: "un satellite che osserva la costa" },
      { file: "assets/puzzle/terra-notte.svg", titolo: "la Terra di notte vista dall'orbita" }
    ]
  },

  /* --- Terra animata in home -----------------------------------------
     null = Terra disegnata in CSS (leggerissima).
     Video: il render di Blender già zoomato e inclinato, con la trasparenza
     (vedi assets/terra/LEGGIMI.md). Misure in pixel del render.
       sorgenti         i file in due grandezze: si usa la più piccola che basta
                        per lo schermo. WebM per Chrome, Firefox e Android, MP4 per
                        Safari e iPhone
       fotogramma       grandezza del render [larghezza, altezza]
       ritaglio         parte del render tenuta nei file [x, y, larghezza, altezza]
       pianeta          centro [x, y] e raggio della superficie (senza nuvole)
       nuvole           fin dove arrivano le nuvole, dal centro: l'orbita dei
                        satelliti passa fuori
       larghezzaMinima  il render è largo quanto lo schermo ma almeno tanti pixel:
                        sui telefoni i lati escono dallo schermo
       altezzaMinima    se l'orbita salirebbe sopra i contenuti (schermi bassi) il
       altezzaMassima   render diventa più piccolo, ma resta alto fra queste due parti
                        dell'altezza dello schermo (0.42 = 42%) */
  terraVideo: {
    sorgenti: [
      { larghezza: 1488, file: ["assets/terra/terra.webm", "assets/terra/terra.mp4"] },
      { larghezza: 2976, file: ["assets/terra/terra-grande.webm", "assets/terra/terra-grande.mp4"] }
    ],
    fotogramma: [3240, 1080],
    ritaglio: [144, 120, 2976, 960],
    pianeta: { centro: [1633, 1847], raggio: 1577 },
    nuvole: 1675,
    larghezzaMinima: 680,
    altezzaMinima: 0.30,
    altezzaMassima: 0.42
  }
});
