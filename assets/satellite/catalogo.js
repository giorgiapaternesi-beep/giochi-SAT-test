/* =====================================================================
   GiochiSAT – pezzi del satellite da costruire (ricompensa della Sfida)

   Ogni pezzo è un'immagine SVG di 600x600 in assets/satellite/pezzi/,
   disegnata già al suo posto: le immagini si sovrappongono una sull'altra
   nell'ordine di "ordine" (la prima sta dietro). Le parti che cambiano
   colore sono disegnate con fill="currentColor" (o stroke).
   Come aggiungere o sostituire pezzi: assets/satellite/LEGGIMI.md
   ===================================================================== */
window.GIOCHISAT_SATELLITE = {
  cartella: "assets/satellite/pezzi/",

  /* ordine in cui si disegnano le sezioni: la prima sta dietro */
  ordine: ["pannelli", "antenna", "strumento", "corpo", "decoro", "luci"],

  /* parte del foglio 600x600 da mostrare (x, y, larghezza, altezza) */
  riquadro: [20, 40, 560, 500],

  /* colori proposti (oltre a questi si può scegliere qualsiasi colore) */
  colori: ["#E6E9F5", "#C9CCDF", "#8E9AB8", "#4A5A8C", "#2A3470", "#4F7DFF", "#29C7D9",
           "#2ED3A0", "#FFC93C", "#E8A33C", "#FF8A3D", "#FF5C8A", "#C77DFF"],

  /* le sezioni, nell'ordine in cui compaiono nel costruttore.
     colore: quello di partenza; riquadro: la zona da mostrare nelle anteprime dei pezzi;
     un pezzo con file null = "niente" */
  sezioni: [
    { id: "corpo", nome: "Corpo", colore: "#8E9AB8", riquadro: [196, 186, 208, 228], pezzi: [
      { id: "scatola",  nome: "Scatola",  file: "corpo-scatola.svg" },
      { id: "cilindro", nome: "Cilindro", file: "corpo-cilindro.svg" },
      { id: "ottagono", nome: "Ottagono", file: "corpo-ottagono.svg" }
    ] },
    { id: "decoro", nome: "Decorazione", colore: "#FFC93C", riquadro: [196, 186, 208, 228], pezzi: [
      { id: "niente",  nome: "Niente",  file: null },
      { id: "strisce", nome: "Strisce", file: "decoro-strisce.svg" },
      { id: "lamina",  nome: "Lamina",  file: "decoro-lamina.svg" },
      { id: "griglia", nome: "Griglia", file: "decoro-griglia.svg" },
      { id: "stella",  nome: "Stella",  file: "decoro-stella.svg" }
    ] },
    { id: "pannelli", nome: "Pannelli solari", colore: "#4A5A8C", riquadro: [20, 190, 560, 220], pezzi: [
      { id: "due-ali",    nome: "Due ali",    file: "pannelli-due-ali.svg" },
      { id: "ali-lunghe", nome: "Ali lunghe", file: "pannelli-ali-lunghe.svg" },
      { id: "ventaglio",  nome: "Ventaglio",  file: "pannelli-ventaglio.svg" }
    ] },
    { id: "antenna", nome: "Antenna", colore: "#E6E9F5", riquadro: [180, 46, 240, 200], pezzi: [
      { id: "parabola", nome: "Parabola", file: "antenna-parabola.svg" },
      { id: "stilo",    nome: "Stilo",    file: "antenna-stilo.svg" },
      { id: "doppia",   nome: "Doppia",   file: "antenna-doppia.svg" }
    ] },
    { id: "strumento", nome: "Strumento", colore: "#C9CCDF", riquadro: [170, 330, 260, 170], pezzi: [
      { id: "obiettivo",  nome: "Obiettivo",  file: "strumento-obiettivo.svg" },
      { id: "radar",      nome: "Radar",      file: "strumento-radar.svg" },
      { id: "telescopio", nome: "Telescopio", file: "strumento-telescopio.svg" }
    ] },
    { id: "luci", nome: "Luci", colore: "#FF5C8A", riquadro: [196, 186, 208, 228],
      colori: ["#FF5C8A", "#FF4040", "#FFC93C", "#2ED3A0", "#29C7D9", "#4F7DFF", "#C77DFF", "#FFFFFF"], pezzi: [
      { id: "due",     nome: "Due",     file: "luci-due.svg" },
      { id: "quattro", nome: "Quattro", file: "luci-quattro.svg" },
      { id: "fila",    nome: "In fila", file: "luci-fila.svg" },
      { id: "niente",  nome: "Niente",  file: null }
    ] }
  ]
};
