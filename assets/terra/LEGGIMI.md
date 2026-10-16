# Terra della home

In fondo alla home c'è la Terra del render di Blender (già zoomata e
inclinata, con la trasparenza e il satellite che le passa davanti):

1. appena si apre la pagina si vede il primo fotogramma, fermo (`terra.webp`);
2. poi parte il video e la Terra gira.

Se il video non può partire (risparmio energetico del telefono, "riduci
movimento" attivo, browser senza WebGL, file mancante) resta il fotogramma
fermo. Non esiste più una Terra disegnata in CSS.

## I file

| File | Grandezza | Per chi |
|---|---|---|
| `terra.webp`, `terra.mp4`, `terra.webm` | 1488×480 (video 1488×960) | quasi tutti gli schermi |
| `terra-grande.webp`, `terra-grande.mp4`, `terra-grande.webm` | 2976×960 (video 2976×1920) | schermi ad alta risoluzione (Mac, 4K) |

Il browser prova prima l'MP4 (va ovunque, iPhone compreso) e, se non lo sa
leggere, il WebM.

Su iPhone i video non si caricano finché la pagina non chiede di farli
partire: `terra-video.js` lo chiede subito (video muto e "in linea", come
richiede Safari).

Ogni fotogramma ha **due metà**: sopra i colori, sotto la trasparenza in grigio
(bianco = pieno, nero = vuoto). Serve perché i video trasparenti non funzionano
su tutti i browser (su iPhone no): `assets/js/terra-video.js` rimette insieme
le due metà nella pagina, quindi la trasparenza funziona ovunque.

## Posizione e grandezza

Le misure stanno in `assets/config.js`, alla voce `terraVideo`, in pixel del
render (3240×1080):

- `fotogramma`: grandezza del render;
- `ritaglio`: la parte del render tenuta nei file (via il vuoto intorno);
- `pianeta`: centro e raggio della superficie; `nuvole`: fin dove arrivano le
  nuvole. Servono a mettere l'alone azzurro attorno al pianeta;
- `cimaVisibile`: la riga più alta in cui si vede qualcosa (nuvole o
  satellite), che deve restare sotto i giochi;
- `larghezzaMinima`, `altezzaMinima`, `altezzaMassima`: come si vede.

Il render è largo quanto lo schermo e poggia sul fondo. Sui telefoni è largo
almeno 680 pixel, quindi i lati escono dallo schermo (il satellite, quando è
più in alto a destra, resta fuori). Sui computer diventa più piccolo se la sua
parte più alta salirebbe sopra i giochi, ma resta alto fra il 30% e il 42%
dello schermo.

Con `terraVideo: null` in fondo alla home non compare nessuna Terra.

## Sostituire il video

1. In Blender: render con trasparenza (Film → Transparent), esportato per
   esempio come WebM VP9 con alfa.
2. Preparare i quattro video con ffmpeg (qui per un render 3240×1080):

   ```
   R="crop=2976:960:144:120,format=rgba,premultiply=inplace=1,format=rgba"
   D="split[c][a];[c]format=rgb24[cc];[a]alphaextract,format=rgb24[aa];[cc][aa]vstack,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
   C="-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"

   # grande
   ffmpeg -c:v libvpx-vp9 -i render.webm -filter_complex "[0:v]$R,$D" -an -c:v libx264 -preset slow -crf 23 -tag:v avc1 -movflags +faststart $C terra-grande.mp4
   ffmpeg -c:v libvpx-vp9 -i render.webm -filter_complex "[0:v]$R,$D" -an -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 $C terra-grande.webm
   # normale (metà grandezza)
   ffmpeg -c:v libvpx-vp9 -i render.webm -filter_complex "[0:v]$R,scale=1488:480:flags=lanczos,format=rgba,$D" -an -c:v libx264 -preset slow -crf 23 -tag:v avc1 -movflags +faststart $C terra.mp4
   ffmpeg -c:v libvpx-vp9 -i render.webm -filter_complex "[0:v]$R,scale=1488:480:flags=lanczos,format=rgba,$D" -an -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 $C terra.webm
   ```

   `-c:v libvpx-vp9` prima di `-i` serve a leggere la trasparenza del WebM; con
   una sequenza PNG si toglie e si scrive per esempio `-framerate 24 -i frame_%04d.png`.

3. Preparare le due immagini ferme dal primo fotogramma (stesso ritaglio,
   trasparenti):

   ```
   ffmpeg -c:v libvpx-vp9 -i render.webm -frames:v 1 -vf "crop=2976:960:144:120" -c:v libwebp -quality 86 -compression_level 6 terra-grande.webp
   ffmpeg -c:v libvpx-vp9 -i render.webm -frames:v 1 -vf "crop=2976:960:144:120,scale=1488:480:flags=lanczos" -c:v libwebp -quality 86 -compression_level 6 terra.webp
   ```

4. Se l'inquadratura cambia, aggiornare in `config.js` `fotogramma`, `ritaglio`,
   `pianeta`, `nuvole` e `cimaVisibile` (e i numeri di `crop` e `scale` qui sopra). Il
   ritaglio deve contenere tutto ciò che si vede in ogni fotogramma, con
   larghezza multipla di 16 e altezza multipla di 64: così nella compressione
   le due metà non si sporcano a vicenda.

I file di oggi vengono da `Terra_gira_satellite.webm` (3240×1080, 500
fotogrammi a 24 al secondo), ritaglio 2976×960 da (144, 120). Pianeta: centro
1633, 1847 e raggio 1577; nuvole fino a 1675; il punto più alto (il satellite)
è alla riga 152.

## Perché un video e non un modello 3D

Per una rotazione lenta il video basta: pochi MB, nessuna libreria, funziona
su qualsiasi telefono. Un modello 3D (per esempio con three.js) richiede una
libreria e le texture del pianeta e scalda di più la batteria: ha senso solo
se si vuole far girare la Terra con il dito.
