/* =====================================================================
   GiochiSAT – Terra animata della home (video)

   Il video è il render di Blender, già zoomato e inclinato, con la
   trasparenza. I video trasparenti non funzionano su tutti i browser
   (su iPhone no), quindi i file del sito portano la trasparenza "a parte":
   nella metà alta del fotogramma ci sono i colori, in quella bassa la
   trasparenza in grigio (bianco = pieno, nero = vuoto). Qui le due metà
   vengono ricomposte su un <canvas> con WebGL.

     GiochiSATTerra.avvia(contenitore, impostazioni)
       contenitore   la zona della Terra in fondo alla home (.h-terra)
       impostazioni  "terraVideo" di assets/config.js

   Posizione e grandezza le decide il CSS della home (index.html) con le
   misure del render, scritte qui come variabili --tv-*. Quando il video è
   visibile il contenitore prende la classe "h-con-video".
   Se qualcosa non va (niente WebGL, file mancante) resta la Terra disegnata.
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
      min: (imp.larghezzaMinima || 0) + "px",
      hmin: (imp.altezzaMinima || 0) * 100 + "vh",
      hmax: (imp.altezzaMassima || 1) * 100 + "vh"
    };
    Object.keys(v).forEach(function (k) { contenitore.style.setProperty("--tv-" + k, v[k]); });
  }

  /* il file più leggero che basta per lo schermo (ingrandito fino a 1,2 volte va ancora bene) */
  function scegliSorgente(sorgenti, pixelNecessari) {
    var elenco = sorgenti.slice().sort(function (a, b) { return a.larghezza - b.larghezza; });
    for (var i = 0; i < elenco.length; i++) if (elenco[i].larghezza * 1.2 >= pixelNecessari) return elenco[i];
    return elenco[elenco.length - 1];
  }

  function tipoDi(file) { return /\.webm$/i.test(file) ? "video/webm" : "video/mp4"; }

  function densita() { return Math.min(window.devicePixelRatio || 1, 2); }

  function avvia(contenitore, imp) {
    if (!contenitore || !imp || !imp.sorgenti || !imp.sorgenti.length) return false;
    var tela = document.createElement("canvas");
    tela.className = "h-terra-video";
    tela.setAttribute("aria-hidden", "true");
    var gl = tela.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return false;                                    // niente WebGL: resta la Terra disegnata
    var prog = programma(gl);
    if (!prog) return false;

    /* --- WebGL: un rettangolo grande quanto il canvas, con il fotogramma come immagine --- */
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

    /* --- il canvas prende posto (lo decide il CSS), poi si sceglie quale file serve --- */
    scriviMisure(contenitore, imp);
    contenitore.appendChild(tela);
    var scelta = scegliSorgente(imp.sorgenti, tela.getBoundingClientRect().width * densita());

    /* --- video: nella pagina ma invisibile (alcuni browser non riproducono i video fuori dal documento) --- */
    var video = document.createElement("video");
    video.className = "h-terra-sorgente";
    video.muted = true; video.loop = true; video.playsInline = true; video.preload = "auto";
    video.setAttribute("muted", ""); video.setAttribute("playsinline", ""); video.setAttribute("aria-hidden", "true");
    scelta.file.forEach(function (file) {
      var s = document.createElement("source");
      s.src = file; s.type = tipoDi(file);
      video.appendChild(s);
    });

    var pronto = false;
    function disegna() {
      if (!pronto) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function nuovoFotogramma() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      pronto = true;
      disegna();
    }
    /* un pixel del canvas per ogni pixel dello schermo (si aggiorna quando cambia la finestra) */
    function misura() {
      var r = tela.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width * densita())), h = Math.max(1, Math.round(r.height * densita()));
      if (w === tela.width && h === tela.height) return;
      tela.width = w; tela.height = h;
      gl.viewport(0, 0, w, h);
      disegna();
    }
    /* aggiorna il canvas a ogni fotogramma nuovo del video */
    function ciclo() {
      if (video.requestVideoFrameCallback) {
        video.requestVideoFrameCallback(function () { nuovoFotogramma(); ciclo(); });
      } else {
        requestAnimationFrame(function () { if (!video.paused) nuovoFotogramma(); ciclo(); });
      }
    }
    /* la Terra disegnata sparisce solo quando il video è davvero visibile */
    function mostra() {
      nuovoFotogramma();
      contenitore.classList.add("h-con-video");
    }
    var osservatore = window.ResizeObserver ? new ResizeObserver(misura) : null;
    function rinuncia() {                                     // si torna alla Terra disegnata
      if (osservatore) osservatore.disconnect();
      window.removeEventListener("resize", misura);
      contenitore.classList.remove("h-con-video");
      tela.remove(); video.remove();
    }

    video.addEventListener("loadeddata", function () {
      gl.uniform1f(u.bordo, 0.5 / video.videoHeight);
      misura();
      if (window.GiochiSAT && GiochiSAT.movimentoRidotto) { mostra(); return; }   // "riduci movimento": immagine ferma
      var avvio = video.play();
      if (avvio && avvio.catch) avvio.catch(mostra);          // riproduzione bloccata (risparmio energetico): immagine ferma
    }, { once: true });
    video.addEventListener("playing", function () { mostra(); ciclo(); }, { once: true });
    video.lastElementChild.addEventListener("error", rinuncia);   // nessuno dei file si carica
    tela.addEventListener("webglcontextlost", rinuncia);
    document.addEventListener("visibilitychange", function () {
      if (!pronto || (window.GiochiSAT && GiochiSAT.movimentoRidotto)) return;
      if (document.hidden) video.pause(); else video.play().catch(function () {});
    });
    if (osservatore) osservatore.observe(tela); else window.addEventListener("resize", misura);

    contenitore.appendChild(video);
    return true;
  }

  window.GiochiSATTerra = { avvia: avvia };
})();
