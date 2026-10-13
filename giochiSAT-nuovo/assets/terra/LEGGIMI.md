# Terra della home

Oggi la Terra in fondo alla home è disegnata così:

- `mappa.svg` è una mappa piatta (5 KB) che scorre lentamente dentro un cerchio:
  sembra un pianeta che ruota. Pesa quasi niente e non usa il processore.
- I tre satelliti girano su un'orbita tratteggiata intorno al pianeta.

Con l'impostazione "riduci movimento" del dispositivo, tutto resta fermo.

## Usare un video al posto del disegno

1. Preparare un video **in loop** della Terra che ruota, inquadrata come nella home
   (si vede solo la parte alta del pianeta).
2. Formato consigliato: WebM (VP9) o MP4 (H.264), larghezza 1280 px,
   10-20 secondi, senza audio, idealmente sotto i 2 MB.
3. Caricarlo in questa cartella, per esempio `assets/terra/terra.webm`.
4. In `assets/config.js` scrivere `terraVideo: "assets/terra/terra.webm"`.

Il video sostituisce la mappa appena è pronto; se non si carica resta il disegno.

## Video o modello 3D?

Per una rotazione lenta conviene il **video**: un file di 1-2 MB, nessuna libreria,
funziona su qualsiasi telefono. Un modello 3D (per esempio con three.js) richiede
una libreria di circa 150-600 KB, le texture del pianeta (spesso 1-4 MB) e scalda
di più la batteria e la scheda grafica: ha senso solo se si vuole far girare la
Terra con il dito.
