# Pezzi del satellite (ricompensa della Sfida)

Chi completa la sfida costruisce il suo satellite in `sfida/ricompensa/`
scegliendo, per ogni parte, il pezzo e il colore. Il satellite finisce
sull'attestato.

**I pezzi di oggi sono segnaposto**: si possono sostituire con disegni
definitivi senza toccare il codice.

## Come sono fatti

- Ogni pezzo è un file **SVG** in `pezzi/`, su un foglio di **600×600**.
- Ogni pezzo è disegnato **già al suo posto**: il satellite si ottiene
  sovrapponendo i fogli, come lucidi. Il centro del corpo è in **300, 300**.
- Le parti che cambiano colore hanno `fill="currentColor"` (o
  `stroke="currentColor"`); ombre e luci sono nero e bianco semitrasparenti
  (per esempio `fill="#000" opacity=".2"`), così funzionano con qualsiasi
  colore. Le parti con un colore fisso (bracci metallici, vetro
  dell'obiettivo) hanno il loro colore normale.

Zone del foglio usate dai pezzi di oggi:

| Parte | Dove sta | File |
|---|---|---|
| Corpo | x 228–372, y 222–378 | `corpo-*.svg` |
| Decorazione (sul corpo) | x 236–364, y 246–354 | `decoro-*.svg` |
| Pannelli solari (ai lati, bracci a y 300) | x 30–570, y 220–380 | `pannelli-*.svg` |
| Antenna (sopra il corpo) | x 230–370, y 50–230 | `antenna-*.svg` |
| Strumento (sotto il corpo) | x 186–414, y 366–490 | `strumento-*.svg` |
| Luci (sul corpo) | angoli e fondo del corpo | `luci-*.svg` |

Ordine di disegno (il primo sta dietro): pannelli, antenna, strumento,
corpo, decorazione, luci. Antenna e strumento possono quindi entrare un po'
sotto il corpo: il corpo li copre.

## Sostituire un pezzo

1. Disegnarlo su una tavola 600×600 (Inkscape, Illustrator, Figma…),
   usando come guida il file di oggi aperto nello stesso programma.
2. Colorare con `currentColor` le parti che devono cambiare colore. In
   Inkscape: scrivere `currentColor` al posto del colore nel campo del
   riempimento (Editor XML → attributo `fill`).
3. Salvare come **SVG semplice** con lo stesso nome del file di oggi (o con
   un nome nuovo, da scrivere in `catalogo.js`).

Accorgimenti:

- niente immagini esterne o incorporate (PNG dentro l'SVG): solo forme;
- evitare gli `id` (sfumature, maschere): i pezzi vengono messi insieme in un
  solo disegno e due `id` uguali si disturbano. Se servono, usare nomi unici
  (per esempio `antenna-parabola-luce`);
- i PNG non possono cambiare colore: se un pezzo deve essere un'immagine
  dipinta, quel pezzo avrà sempre lo stesso colore.

## Aggiungere un pezzo o una parte

Tutto si decide in `catalogo.js`:

- **nuovo pezzo**: aggiungere una riga nell'elenco `pezzi` della sua parte,
  con `id`, `nome` (quello che si legge sul pulsante) e `file`.
  `file: null` è il pezzo "Niente";
- **colori proposti**: l'elenco `colori` (uguale per tutte le parti) o un
  elenco `colori` dentro una parte (come per le luci). Oltre a questi si può
  sempre scegliere un colore esatto;
- **colore di partenza** della parte: `colore`;
- **riquadro**: la zona del foglio mostrata nelle anteprime dei pezzi;
- **nuova parte** (per esempio "Bracci"): una nuova voce in `sezioni` e il
  suo `id` nell'elenco `ordine`, al posto giusto tra quelle davanti e dietro.

Il pulsante **Casuale** sceglie per ogni parte un pezzo e un colore tra
quelli proposti (corpo e decorazione mai dello stesso colore).
