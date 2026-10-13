# Giochi SAT – ARPA Lazio

Giochi educativi sull'osservazione satellitare della Terra, realizzati dal
Servizio Attività Produttive e Controlli di ARPA Lazio.

**Sito pubblicato:** https://arpalaziosat.github.io/giochiSAT/
(GitHub Pages: ogni file caricato sul ramo `main` va online in qualche minuto).

## Come si usa il sito

- **Home**: tre scelte, come nello schizzo di progetto.
  - **Modalità sfida**: si sceglie la difficoltà, il sito estrae a caso alcuni
    giochi singleplayer da completare uno dopo l'altro entro un tempo limite.
    Chi finisce tutto in tempo ottiene la ricompensa.
  - **Esercitati → Singleplayer**: i giochi della sfida, uno alla volta
    (tra questi il **Quizzone** da giocare da soli, che ha preso il posto di
    Osserva la Terra).
  - **Esercitati → Multiplayer**: Quizzone Live, Duello orbitale, Sfida del sensore.
- **Soprannome**: nessuna registrazione. Il soprannome si sceglie una volta
  (in alto a destra, nella sfida o nei giochi che lo chiedono) e resta valido
  passando da un gioco all'altro. **Ricaricando la pagina viene dimenticato**:
  utile sui monitor degli eventi, dove giocano persone diverse.
  Sono accettati solo lettere, numeri, spazi, punto, trattino e underscore
  (niente email o numeri di telefono).
- **Difficoltà**: ogni gioco singleplayer ha tre difficoltà (Facile, Media,
  Difficile) e si sceglie **solo prima di iniziare**:
  - in Esercitazione, toccando un gioco nell'elenco si apre la finestra di
    scelta; durante la partita la difficoltà si vede sotto la barra ma non si
    cambia. Un gioco aperto da un link diretto (per esempio un QR code) passa
    prima dall'elenco con la finestra già aperta;
  - nella Sfida si sceglie una volta all'inizio e vale per tutti i giochi.
- **Sfida veloce**: finito un gioco compare subito *Prossimo gioco*; i
  pulsanti come *Gioca ancora* o *Menu* dei singoli giochi durante la sfida
  sono nascosti.
- Ogni pagina ha in alto il pulsante **Home**.

## Struttura

```
giochiSAT/
├── index.html                 Home
├── 404.html                   Pagina per gli indirizzi sbagliati
├── sfida/                     Modalità sfida: scelta della difficoltà
│   ├── risultato/             Com'è andata
│   └── ricompensa/            Ricompensa (segnaposto) + ricompensa.js da completare
├── esercitazione/
│   ├── singleplayer/          Elenco dei giochi singleplayer
│   └── multiplayer/           Elenco dei giochi multiplayer
│
├── memory/  missione-satellite/  quiz-terra/  sensore-adatto/
├── puzzle-satelliti/  sat-doku/  parole-in-orbita/      ← singleplayer
│   (quiz-terra/ è il Quizzone da soli: la cartella ha tenuto il vecchio
│    nome per non rompere link, QR e statistiche)
├── quizzone/  duello-orbitale/  sensore-sfida/          ← multiplayer
│
├── quizzone-monitor/          Schermo pubblico del Quizzone (con QR code)
├── quizzone-regia/            Regia del Quizzone (password)
├── statistiche/               Statistiche di utilizzo (password)
├── classifica-memory/         Classifica del Memory per i monitor
│
├── assets/
│   ├── config.js              ★ Configurazione: database, giochi, regole della sfida
│   ├── css/giochisat.css      Stile comune (colori, cielo, barra, pulsanti)
│   ├── js/giochisat.js        Script comune (cielo stellato, soprannome, sfida)
│   ├── fonts/                 Font Poppins ospitato sul sito + licenza
│   ├── terra/                 Terra della home (mappa.svg; spazio per un video)
│   ├── quiz/domande.txt       ★ Domande del Quizzone da soli (si modificano qui)
│   ├── js/domande.js          Lettura delle domande (usato dal Quizzone e dal controllo)
│   ├── memory/retro.svg       Retro delle carte del Memory (segnaposto da sostituire)
│   ├── puzzle/                Immagini extra del Puzzle della Terra
│   ├── ricompense/            File della ricompensa (da preparare)
│   ├── game-stats.js          Conteggio anonimo delle partite
│   └── parole-italiane-giochisat.js   Vocabolario di "Parole in orbita"
├── immagini/                  Carte del Memory
└── docs/                      Istruzioni storiche degli aggiornamenti
```

I due file `.html` nella radice (`missione_satellite_gioco2.html`,
`quiz_osserva_la_terra_gioco1.html`) rinviano ai vecchi indirizzi: si possono
eliminare quando nessun QR o link li usa più.

## Cosa si cambia da `assets/config.js`

- **Regole della sfida** (`sfida.difficolta`): numero di giochi e minuti per
  ogni difficoltà. Oggi sono impostati per il **play testing** (tutti i 7 giochi,
  60 minuti): abbassarli dopo aver misurato i tempi reali.
- **Difficoltà dei giochi** (`livelli`): per ogni gioco e per ogni difficoltà
  cosa cambia. Ogni voce ha una `descrizione`, che è il testo mostrato sotto
  i pulsanti della difficoltà.

  | Gioco | Facile | Media | Difficile |
  |---|---|---|---|
  | Memory | 6 coppie, 90 s | 8 coppie, 60 s | 8 coppie, 30 s |
  | Missione satellite | 2 risposte | 3 risposte | 3 risposte, 20 s per anomalia |
  | Quizzone | 3 facili + 2 normali, senza tempo | 1 facile + 3 normali + 1 difficile, 30 s a domanda | 2 normali + 3 difficili, 15 s a domanda |
  | Il sensore giusto | mira larga, aiuto | mira normale, aiuto | mira precisa, senza aiuto |
  | Puzzle della Terra | 12 pezzi | 20 pezzi | 30 pezzi |
  | SAT-Doku | 4×4, suggerimenti | 5×5, suggerimenti | 5×5, senza suggerimenti |
  | Parole in orbita | 4×4, 120 s | 4×4, 90 s | 5×5, 120 s |

- **Retro delle carte del Memory** (`memory.retro`): oggi è un segnaposto,
  `assets/memory/retro.svg`. Per cambiarlo basta sostituire il file (stesso
  nome) oppure indicare qui un'altra immagine (consigliato formato 4:3,
  per esempio 400×300, PNG, JPG, WebP o SVG).
- **Immagini del puzzle** (`puzzle.immagini`): a ogni partita ne viene scelta
  una diversa. `file: null` è il disegno originale del gioco; le altre stanno
  in `assets/puzzle/` (formato 5:4, per esempio 1000×800). `titolo` è il testo
  mostrato a puzzle completato.
- **Domande del Quizzone**: non stanno in `config.js` ma in
  `assets/quiz/domande.txt` (vedi sotto). In `config.js` si decide solo quante
  domande facili, normali e difficili pescare (`livelli` → `"quiz-terra"` →
  `domande`) e i secondi per domanda.
- **Elenco dei giochi** (`giochi`): nome, descrizione, colore, tipo
  (`single` o `multi`). Le pagine di Esercitazione si costruiscono da qui.
- **Video della Terra** (`terraVideo`): vedi `assets/terra/LEGGIMI.md`.
- **Database**: indirizzo e chiave pubblica di Supabase (unico punto).

## Domande del Quizzone

Il Quizzone da giocare da soli pesca **5 domande a caso** da
`assets/quiz/domande.txt`, secondo la difficoltà scelta (tabella sopra), e le
propone dalla più facile alla più difficile. Anche l'ordine delle risposte
cambia a ogni partita.

Il file si modifica direttamente su GitHub (apri il file → matita → *Commit
changes*). Ogni domanda è un blocco così:

```
[normale] Come fa un satellite ad accorgersi di un incendio anche a distanza?
+ Rileva il calore e il fumo con sensori a infrarossi
- Registra il rumore delle fiamme dallo spazio
- Riesce a vederlo solo con un cielo perfettamente sereno
> I satelliti hanno sensori a **infrarossi** che percepiscono il calore…
```

- `[facile]`, `[normale]` o `[difficile]` all'inizio: per cambiare la
  difficoltà di una domanda basta cambiare questa parola.
- `+` la risposta giusta (una sola), `-` le sbagliate: da 2 a 4 risposte.
- `>` la spiegazione mostrata dopo la risposta (facoltativa);
  `**parola**` diventa grassetto.
- Le righe che iniziano con `#` sono note e vengono ignorate.

Dopo una modifica aprire **`quiz-terra/controllo/`** sul sito: la pagina dice
quante domande valide ci sono per ogni difficoltà, se bastano per le tre
difficoltà della partita e, riga per riga, cosa c'è da correggere. Una
domanda scritta male viene saltata, ma il gioco continua a funzionare. Se per
una difficoltà le domande non bastano, il gioco completa la partita con
quelle della difficoltà più vicina.

Le domande segnate `# nuova` sono state scritte per avere abbastanza varietà
e vanno ricontrollate. Il **Quizzone Live** degli eventi è un'altra cosa: le
sue domande e risposte stanno nel database Supabase, così i partecipanti non
possono leggerle nella pagina, e non usano questo file.

Per provare il Quizzone sul proprio computer serve un piccolo server (per
esempio `python -m http.server` nella cartella del sito): aprendo il file
`index.html` con un doppio clic il browser non lascia leggere `domande.txt`.

## Pagine e file comuni

Ogni pagina carica, nell'`<head>` e in quest'ordine:

```html
<script src="../assets/config.js"></script>
<link rel="stylesheet" href="../assets/css/giochisat.css">
<script src="../assets/js/giochisat.js"></script>
```

e ha `<body class="gs" data-gioco="id-del-gioco" style="--gs-colore:#...">`
seguito dalla barra comune `<header class="gs-barra">` (copiarla da un gioco).
Le classi comuni iniziano con `gs-` per non scontrarsi con quelle dei giochi.

### Collegare un gioco alla sfida

1. Aggiungerlo in `assets/config.js` con `tipo: "single"`.
2. Quando la partita finisce, chiamare:
   ```js
   GiochiSAT.fineGioco("id-del-gioco", { completato: true, punti: 42 });
   ```
   (`completato: false` se la partita è persa: la sfida propone Riprova o Salta).
3. Per avere le tre difficoltà, aggiungere il gioco in `livelli` dentro
   `assets/config.js` e leggere i valori nel gioco con:
   ```js
   const LIVELLO = GiochiSAT.difficolta.parametri("id-del-gioco");
   // es. { coppie: 8, secondi: 60, descrizione: "..." }
   ```
   La scelta all'ingresso e l'etichetta sotto la barra arrivano da sole per
   i giochi che hanno una voce in `livelli`. La difficoltà viaggia
   nell'indirizzo (`memory/?livello=facile`); senza, il gioco non parte e
   rimanda alla scelta.
4. Ai pulsanti che servono solo in Esercitazione (*Gioca ancora*,
   *Ricomincia*, *Menu*…) aggiungere l'attributo `data-gs-esercitazione`:
   durante la sfida vengono nascosti, così si passa subito al gioco dopo.
   ```html
   <button id="again" data-gs-esercitazione>Gioca ancora</button>
   ```

Fuori dalla sfida `fineGioco` non fa nulla di visibile, quindi si può
chiamare sempre. Nella sfida la finestra *Prossimo gioco* compare dopo 0,4
secondi (per lasciar vedere l'ultima mossa); si può cambiare con
`{ ritardo: millisecondi }`.

### Soprannome nei giochi

```js
GiochiSAT.nome.get()              // soprannome attuale ("" se non scelto)
GiochiSAT.nome.set("Stella23")    // salva (false se non valido)
GiochiSAT.nome.errore(testo)      // messaggio d'errore oppure ""
GiochiSAT.nome.collega(input)     // collega un campo del gioco al soprannome comune
GiochiSAT.nome.chiedi()           // finestra per sceglierlo
```

## Database (Supabase)

- Indirizzo e chiave pubblica sono **solo** in `assets/config.js`.
- La chiave è di tipo *publishable*: è pensata per pagine pubbliche. La
  protezione dei dati dipende dalle regole RLS e dalle funzioni in Supabase.
- **Mai** inserire nel repository la chiave *secret* / *service_role*.
- Gli script `.sql` si eseguono nel SQL Editor di Supabase e **non** vanno qui.
- Sul piano gratuito i progetti inattivi vengono messi in pausa: prima di un
  evento aprire il pannello Supabase e verificare che il progetto sia attivo.

## Privacy e buone pratiche già applicate

- Nessun nome vero, email o registrazione; il soprannome vive solo nella scheda del browser.
- Il Quizzone ricorda la partecipazione solo per la scheda aperta (non più in modo permanente).
- I font sono ospitati sul sito: nessuna richiesta a Google Fonts.
- Pagine di regia e statistiche escluse dai motori di ricerca (`noindex`).
- Animazioni disattivate per chi ha impostato "riduci movimento" sul dispositivo.
- Il monitor del Quizzone carica il logo come file (la pagina è passata da 180 KB a 28 KB).

## Come aggiornare

1. Se l'aggiornamento richiede uno script SQL, eseguirlo prima in Supabase.
2. Caricare i file mantenendo la struttura delle cartelle (non caricare la
   cartella contenitore come sottocartella).
3. Scrivere un messaggio che descriva la modifica (es. «SAT-Doku: aggiunto
   livello avanzato») invece di «Add files via upload».
4. Non caricare copie come `index (3).html`: sostituire il file esistente.
5. Attendere qualche minuto e ricaricare il sito con Ctrl+F5.

## Da fare

- Decidere e preparare la **ricompensa** (`assets/ricompense/LEGGIMI.md`).
- Misurare i tempi reali e abbassare giochi e minuti della sfida.
- Fissare la versione della libreria Supabase (oggi `@supabase/supabase-js@2`
  carica sempre l'ultima 2.x): sostituire `@2` con la versione esatta in uso.
- Far scrivere la classifica del Memory tramite una funzione con controlli,
  come già avviene per Quizzone e sfida del sensore.
- Ricontrollare le domande nuove del Quizzone (segnate `# nuova`) e
  aggiungere quelle del Quizzone Live.
- Sostituire il retro delle carte del Memory e, se si vuole, le immagini
  extra del puzzle (oggi disegni segnaposto).
- Le foto delle carte del Memory potrebbero diventare illustrazioni piatte,
  nello stile del resto del sito.

## Licenze

- Font Poppins: SIL Open Font License 1.1, vedi `assets/fonts/OFL.txt`.
- Vocabolario di "Parole in orbita": da
  [napolux/paroleitaliane](https://github.com/napolux/paroleitaliane), licenza
  MIT, vedi `LICENZA_DIZIONARIO_ITALIANO.txt`.
