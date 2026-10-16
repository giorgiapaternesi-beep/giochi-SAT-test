/* =====================================================================
   GiochiSAT – Terra della home (render di Blender: immagine ferma + video)

   Il render è già zoomato e inclinato, con la trasparenza e il satellite.
   1. Subito si vede un fotogramma fermo (WebP trasparente): funziona ovunque.
   2. Poi parte il video, che lo sostituisce. I video trasparenti non
      funzionano su tutti i browser (su iPhone no), quindi i file del sito
      portano la trasparenza "a parte": nella metà alta del fotogramma i
      colori, in quella bassa la trasparenza in grigio (bianco = pieno,
      nero = vuoto). Qui le due metà vengono ricomposte su un <canvas> con
      WebGL.
   Se il video non può partire (risparmio energetico, "riduci movimento",
   niente WebGL, file mancante) resta l'immagine ferma.

     GiochiSATTerra.avvia(contenitore, impostazioni)
       contenitore   la zona della Terra in fondo alla home (.h-terra)
       impostazioni  "terraVideo" di assets/config.js

   Posizione e grandezza le decide il CSS della home (index.html) con le
   misure del render, scritte qui come variabili --tv-*. Quando il video è
   visibile il contenitore prende la classe "h-con-video".
   ===================================================================== */
(function () {
  "use strict";

  /* trasparenza sotto cui un pixel è vuoto e sopra cui è pieno (toglie il rumore della compressione) */
  var SOGLIA = [0.04, 0.97];

  var VERTICI =
    "attribute vec2 angolo;" +                    // angolo del canvas: da 0,0 (in alto a sinistra) a 1,1
    "varying vec2 uv;" +
    "void main(){" +
    "  uv = angolo;" +
    "  gl_Position = vec4(angolo.x * 2.0 - 1.0, 1.0 - angolo.y * 2.0, 0.0, 1.0);" +
    "}";

  var FRAMMENTI =
    "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n" +
    "varying vec2 uv;" +
    "uniform sampler2D fotogramma;" +
    "uniform float bordo;" +                      // mezzo pixel del video: non pescare nell'altra metà
    "uniform vec2 soglia;" +
    "void main(){" +
    "  float y = clamp(uv.y * 0.5, bordo, 0.5 - bordo);" +
    "  vec3 c = texture2D(fotogramma, vec2(uv.x, y)).rgb;" +          // metà alta: colori (già scuriti dove è trasparente)
    "  float a = texture2D(fotogramma, vec2(uv.x, y + 0.5)).g;" +     // metà bassa: trasparenza
    "  a = clamp((a - soglia.x) / (soglia.y - soglia.x), 0.0, 1.0);" +
    "  gl_FragColor = vec4(min(c, vec3(a)), a);" +
    "}";

  function compila(gl, tipo, sorgente) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, sorgente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function programma(gl) {
    try {
      var p = gl.createProgram();
      gl.attachShader(p, compila(gl, gl.VERTEX_SHADER, VERTICI));
      gl.attachShader(p, compila(gl, gl.FRAGMENT_SHADER, FRAMMENTI));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    } catch (e) { return null; }
  }

  /* misure del render (config.js) come variabili CSS: le usa index.html */
  function scriviMisure(contenitore, imp) {
    var r = imp.ritaglio, p = imp.pianeta, v = {
      fw: imp.fotogramma[0], fh: imp.fotogramma[1],
      rx: r[0], ry: r[1], rw: r[2], rh: r[3],
      cx: p.centro[0], cy: p.centro[1], r: p.raggio, nuvole: imp.nuvole || p.raggio,
      vis: imp.cimaVisibile || 0,
      min: (imp.larghezzaMinima || 0) + "px",
      hmin: (imp.altezzaMinima || 0) * 100 + "vh",
      hmax: (imp.altezzaMassima || 1) * 100 + "vh"
    };
    Object.keys(v).forEach(function (k) { contenitore.style.setProperty("--tv-" + k, v[k]); });
  }

  /* i file più leggeri che bastano per lo schermo (ingranditi fino a 1,2 volte vanno ancora bene) */
  function scegliSorgente(sorgenti, pixelNecessari) {
    var elenco = sorgenti.slice().sort(function (a, b) { return a.larghezza - b.larghezza; });
    for (var i = 0; i < elenco.length; i++) if (elenco[i].larghezza * 1.2 >= pixelNecessari) return elenco[i];
    return elenco[elenco.length - 1];
  }

  function tipoDi(file) { return /\.webm$/i.test(file) ? "video/webm" : "video/mp4"; }

  function densita() { return Math.min(window.devicePixelRatio || 1, 2); }

  /* --- il video sopra l'immagine ferma; se qualcosa non va si toglie e resta l'immagine --- */
  function avviaVideo(contenitore, file) {
    var tela = document.createElement("canvas");
    tela.className = "h-terra-video";
    tela.setAttribute("aria-hidden", "true");
    var gl = tela.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return;                                          // niente WebGL: resta l'immagine ferma
    var prog = programma(gl);
    if (!prog) return;

    /* WebGL: un rettangolo grande quanto il canvas, con il fotogramma come immagine */
    gl.useProgram(prog);
    var u = {};
    ["fotogramma", "bordo", "soglia"].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    var attr = gl.getAttribLocation(prog, "angolo");
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (p) { gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE); });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(u.fotogramma, 0);
    gl.uniform2f(u.soglia, SOGLIA[0], SOGLIA[1]);

    /* video: muto, in linea e nella pagina (invisibile), come vogliono iPhone e Android
       per partire da solo; gli attributi vanno messi prima dei file */
    var video = document.createElement("video");
    video.className = "h-terra-sorgente";
    video.muted = true; video.defaultMuted = true; video.loop = true; video.autoplay = true;
    video.playsInline = true; video.preload = "auto";
    ["muted", "loop", "autoplay", "playsinline", "webkit-playsinline"].forEach(function (a) { video.setAttribute(a, ""); });
    video.setAttribute("aria-hidden", "true");
    file.forEach(function (f) {
      var s = document.createElement("source");
      s.src = f; s.type = tipoDi(f);
      video.appendChild(s);
    });

    var attivo = true, visibile = false;
    function disegna() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    /* copia sul canvas il fotogramma corrente; al primo, il video prende il posto dell'immagine */
    function nuovoFotogramma() {
      if (!attivo || video.readyState < 2 || !video.videoHeight) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      if (!visibile) {
        gl.uniform1f(u.bordo, 0.5 / video.videoHeight);
        visibile = true;
        contenitore.classList.add("h-con-video");
      }
      disegna();
    }
    /* un pixel del canvas per ogni pixel dello schermo (si aggiorna quando cambia la finestra) */
    function misura() {
      var r = tela.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * densita())), h = Math.max(1, Math.round(r.height * densita()));
      if (w === tela.width && h === tela.height) return;
      tela.width = w; tela.height = h;
      gl.viewport(0, 0, w, h);
      if (visibile) disegna();
    }
    /* aggiorna il canvas a ogni fotogramma nuovo del video */
    function ciclo() {
      if (!attivo) return;
      if (video.requestVideoFrameCallback) {
        video.requestVideoFrameCallback(function () { nuovoFotogramma(); ciclo(); });
      } else {
        requestAnimationFrame(function () { if (!video.paused) nuovoFotogramma(); ciclo(); });
      }
    }
    var osservatore = window.ResizeObserver ? new ResizeObserver(misura) : null;
    function rinuncia() {                                     // via il video: resta l'immagine ferma
      if (!attivo) return;
      attivo = false;
      if (osservatore) osservatore.disconnect();
      window.removeEventListener("resize", misura);
      contenitore.classList.remove("h-con-video");
      video.pause(); video.removeAttribute("src");
      tela.remove(); video.remove();
    }

    video.lastElementChild.addEventListener("error", rinuncia);   // nessuno dei file si carica
    tela.addEventListener("webglcontextlost", rinuncia);
    document.addEventListener("visibilitychange", function () {
      if (!attivo) return;
      if (document.hidden) video.pause(); else video.play().catch(function () {});
    });
    if (osservatore) osservatore.observe(tela); else window.addEventListener("resize", misura);

    contenitore.appendChild(tela);
    contenitore.appendChild(video);
    misura();
    ciclo();
    /* si chiede subito di partire: su iPhone il video non si carica finché non parte */
    var avvio = video.play();
    if (avvio && avvio.catch) avvio.catch(function (e) {
      if (!e || e.name !== "AbortError") rinuncia();          // bloccato (risparmio energetico) o file non leggibile
    });
  }

  function avvia(contenitore, imp) {
    if (!contenitore || !imp || !imp.sorgenti || !imp.sorgenti.length) return false;
    scriviMisure(contenitore, imp);

    /* 1. immagine ferma: prende posto (lo decide il CSS), poi si sceglie quale grandezza serve */
    var ferma = document.createElement("img");
    ferma.className = "h-terra-ferma";
    ferma.alt = "";
    ferma.decoding = "async";
    contenitore.appendChild(ferma);
    var scelta = scegliSorgente(imp.sorgenti, ferma.getBoundingClientRect().width * densita());
    ferma.src = scelta.immagine;

    /* 2. video, se il movimento non è ridotto */
    if (!(window.GiochiSAT && GiochiSAT.movimentoRidotto)) avviaVideo(contenitore, scelta.video);
    return true;
  }

  window.GiochiSATTerra = { avvia: avvia };
})();
