/* =====================================================================
   GiochiSAT – Terra animata della home (video)

   Il video mostra la Terra su fondo NERO: i formati video adatti al web
   non conservano la trasparenza su tutti i browser (su iPhone no).
   Qui il video viene disegnato su un <canvas> con WebGL e il nero diventa
   trasparente; il pianeta viene ingrandito e inclinato come la Terra
   disegnata che sostituisce, di cui prende posizione e grandezza.

     GiochiSATTerra.avvia(pianeta, impostazioni)
       pianeta       elemento della Terra disegnata (.h-pianeta)
       impostazioni  "terraVideo" di assets/config.js

   Se qualcosa non va (niente WebGL, video bloccato, risparmio energetico)
   resta semplicemente la Terra disegnata.
   ===================================================================== */
(function () {
  "use strict";

  /* luminosità sotto cui un pixel è trasparente e sopra cui è pieno: abbastanza alta da
     togliere anche le ombre scure ai bordi delle nuvole (la Terra è sempre più chiara) */
  var SOGLIA = [0.18, 0.40];

  var VERTICI =
    "attribute vec2 angolo;" +                    // angolo del fotogramma: da 0,0 a 1,1
    "uniform vec2 tela;" +                        // dimensioni del canvas (pixel)
    "uniform vec2 video;" +                       // dimensioni del video (pixel)
    "uniform vec2 centroVideo;" +                 // centro del pianeta nel video
    "uniform vec2 centro;" +                      // centro del pianeta sul canvas
    "uniform float zoom;" +                       // pixel del canvas per pixel del video
    "uniform float angoloAsse;" +                 // inclinazione (radianti)
    "varying vec2 uv;" +
    "void main(){" +
    "  vec2 p = (angolo * video - centroVideo) * zoom;" +
    "  float c = cos(angoloAsse), s = sin(angoloAsse);" +
    "  p = centro + vec2(c * p.x - s * p.y, s * p.x + c * p.y);" +
    "  vec2 clip = p / tela * 2.0 - 1.0;" +
    "  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);" +
    "  uv = angolo;" +
    "}";

  var FRAMMENTI =
    "precision mediump float;" +
    "varying vec2 uv;" +
    "uniform sampler2D fotogramma;" +
    "uniform vec2 soglia;" +
    "void main(){" +
    "  vec3 c = texture2D(fotogramma, uv).rgb;" +
    "  float a = smoothstep(soglia.x, soglia.y, max(c.r, max(c.g, c.b)));" +
    // sul fondo nero i colori dei bordi sono già "mescolati" col nero: vanno bene così
    "  gl_FragColor = vec4(min(c, vec3(a)), a);" +
    "}";

  function compila(gl, tipo, sorgente) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, sorgente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function tipoDi(file) { return /\.webm$/i.test(file) ? "video/webm" : "video/mp4"; }

  function avvia(pianeta, imp) {
    if (!pianeta || !imp || !imp.sorgenti || !imp.sorgenti.length) return false;
    var contenitore = pianeta.parentNode;
    var tela = document.createElement("canvas");
    tela.className = "h-terra-video";
    tela.setAttribute("aria-hidden", "true");
    var gl = tela.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) return false;                                    // niente WebGL: resta la Terra disegnata

    /* --- video: nella pagina ma invisibile (alcuni browser non riproducono
           i video fuori dal documento) --- */
    var video = document.createElement("video");
    video.className = "h-terra-sorgente";
    video.muted = true; video.loop = true; video.playsInline = true; video.preload = "auto";
    video.setAttribute("muted", ""); video.setAttribute("playsinline", ""); video.setAttribute("aria-hidden", "true");
    imp.sorgenti.forEach(function (file) {
      var s = document.createElement("source");
      s.src = file; s.type = tipoDi(file);
      video.appendChild(s);
    });

    /* --- programma WebGL --- */
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compila(gl, gl.VERTEX_SHADER, VERTICI));
      gl.attachShader(prog, compila(gl, gl.FRAGMENT_SHADER, FRAMMENTI));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { return false; }
    gl.useProgram(prog);
    var u = {};
    ["tela", "video", "centroVideo", "centro", "zoom", "angoloAsse", "soglia"].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    var attr = gl.getAttribLocation(prog, "angolo");
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (p) { gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE); });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform2f(u.soglia, SOGLIA[0], SOGLIA[1]);
    gl.uniform1f(u.angoloAsse, (imp.inclinazione || 0) * Math.PI / 180);

    /* --- misure: il pianeta del video prende il posto di quello disegnato --- */
    function misura() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rt = tela.getBoundingClientRect(), rp = pianeta.getBoundingClientRect();
      tela.width = Math.round(rt.width * dpr);
      tela.height = Math.round(rt.height * dpr);
      gl.viewport(0, 0, tela.width, tela.height);
      gl.uniform2f(u.tela, tela.width, tela.height);
      gl.uniform2f(u.centro, (rp.left + rp.width / 2 - rt.left) * dpr, (rp.top + rp.height / 2 - rt.top) * dpr);
      gl.uniform1f(u.zoom, (rp.width / 2) * dpr / imp.raggio);
      disegna();
    }

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

    video.addEventListener("loadeddata", function () {
      gl.uniform2f(u.video, video.videoWidth, video.videoHeight);
      gl.uniform2f(u.centroVideo, imp.centro[0], imp.centro[1]);
      misura();
      if (window.GiochiSAT && GiochiSAT.movimentoRidotto) { mostra(); return; }   // "riduci movimento": immagine ferma
      var avvio = video.play();
      if (avvio && avvio.catch) avvio.catch(function () { /* riproduzione bloccata: resta la Terra disegnata */ });
    }, { once: true });
    video.addEventListener("playing", function () { mostra(); ciclo(); }, { once: true });
    // se anche l'ultimo file non si carica, si torna alla Terra disegnata
    video.lastElementChild.addEventListener("error", function () { tela.remove(); video.remove(); });
    document.addEventListener("visibilitychange", function () {
      if (!pronto || (window.GiochiSAT && GiochiSAT.movimentoRidotto)) return;
      if (document.hidden) video.pause(); else video.play().catch(function () {});
    });
    window.addEventListener("resize", misura);

    pianeta.after(tela);
    contenitore.appendChild(video);
    return true;
  }

  window.GiochiSATTerra = { avvia: avvia };
})();
