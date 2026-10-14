# Terra della home

In fondo alla home gira la Terra del video `terra.webm` / `terra.mp4`
(animazione fatta in Blender). Se il video non parte (browser molto vecchio,
risparmio energetico del telefono, file mancante) resta la Terra disegnata:
`mappa.svg`, una mappa piatta che scorre dentro un cerchio.

Con l'impostazione "riduci movimento" del dispositivo la Terra resta ferma.

## Come funziona

- Il video ha la Terra su **fondo nero**: i formati video adatti al web non
  conservano la trasparenza su tutti i browser (su iPhone no). Il file
  `assets/js/terra-video.js` disegna il video su un canvas e rende trasparente
  il nero, quindi funziona ovunque.
- Il pianeta del video prende **posizione e grandezza** della Terra disegnata
  (`.h-pianeta` in `index.html`): per spostarlo o ingrandirlo si cambia quella.
- In `assets/config.js`, alla voce `terraVideo`:
  - `sorgenti`: i file (WebM per Chrome, Firefox e Android; MP4 per Safari e iPhone);
  - `centro` e `raggio`: dove sta il pianeta nel video, in pixel (raggio con le nuvole);
  - `inclinazione`: gradi di inclinazione dell'asse (23,4 come la Terra vera).
- Per tornare alla Terra disegnata basta scrivere `terraVideo: null`.

## Sostituire il video

1. In Blender: sfondo **nero puro** (World nero, niente stelle), la Terra al
   centro dell'inquadratura, animazione in loop. La trasparenza non serve.
2. Convertire nei due formati, per esempio con ffmpeg:

   ```
   ffmpeg -i terra.mkv -c:v libvpx-vp9 -b:v 0 -crf 33 -row-mt 1 -an terra.webm
   ffmpeg -i terra.mkv -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart -an terra.mp4
   ```

3. Mettere i file in questa cartella e aggiornare `centro` e `raggio` in `config.js`.

I file di oggi vengono dal video 1080×1080 ritagliato a 860×860 (via il nero
inutile intorno): il pianeta ha centro in 430, 429 e raggio 419 px nuvole comprese.

**Per un risultato più nitido**: sul sito si vede solo la parte alta del
pianeta, molto ingrandita (sugli schermi grandi circa 3-4 volte). Esportando
a 2160×2160, oppure inquadrando solo la calotta superiore a risoluzione alta,
le nuvole e il bordo restano più definiti.

## Perché un video e non un modello 3D

Per una rotazione lenta il video basta: circa 2 MB, nessuna libreria, funziona
su qualsiasi telefono. Un modello 3D (per esempio con three.js) richiede una
libreria e le texture del pianeta e scalda di più la batteria: ha senso solo
se si vuole far girare la Terra con il dito.
