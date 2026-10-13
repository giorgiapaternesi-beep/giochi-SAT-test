# Ricompense della modalità Sfida

Cartella pronta per i file della ricompensa (ancora da decidere).

## Come è collegata

1. Chi completa tutti i giochi della sfida in tempo arriva alla pagina
   `sfida/risultato/` e vede il pulsante **Ritira la ricompensa**.
2. Il pulsante apre `sfida/ricompensa/`, che carica `sfida/ricompensa/ricompensa.js`.
3. In `ricompensa.js` la funzione `mostra(esito, contenitore)` decide cosa
   mostrare, usando i file messi in questa cartella.

## Idee di file da mettere qui

- `badge-facile.png`, `badge-media.png`, `badge-difficile.png`: un badge per difficoltà.
- `attestato.svg`: un attestato con uno spazio per il soprannome, da scaricare o stampare.
- Immagini o brevi video da sbloccare.

## Da sapere

- Il controllo "ha vinto" avviene nel browser: va bene per premi simbolici.
  Per premi fisici (gadget allo stand) serve una verifica sul database
  oppure un codice mostrato a schermo da controllare a vista.
- Non chiedere nomi veri o email per consegnare la ricompensa.
