// Sonido de Cosecha Helada: efectos y música chiptune hechos con Web Audio.
// No usa archivos de audio: cada sonido se arma con osciladores y ruido.
const Sonido = (() => {
  let ctx = null, maestro = null, busEfectos = null, busMusica = null, ruido = null;
  let mudo = false;
  try { mudo = localStorage.getItem('cosechaHelada.mudo') === '1'; } catch (e) { /* sin almacenamiento */ }
  const VOLUMEN = 0.8;

  // El navegador solo deja crear el audio después de una tecla o un toque.
  function iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    maestro = ctx.createGain();
    maestro.gain.value = mudo ? 0 : VOLUMEN;
    maestro.connect(ctx.destination);
    busEfectos = ctx.createGain(); busEfectos.gain.value = 0.9; busEfectos.connect(maestro);
    busMusica = ctx.createGain(); busMusica.gain.value = 0.5; busMusica.connect(maestro);
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const ahora = () => (ctx ? ctx.currentTime : 0);

  // Un tono con envolvente corta; f2 hace un barrido de frecuencia.
  function tono(f, { f2 = 0, dur = 0.12, tipo = 'square', vol = 0.12, t = 0, bus = null } = {}) {
    if (!ctx) return;
    const t0 = t || ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(bus || busEfectos);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  // Ruido filtrado: agua, golpes, "puff" y platillos.
  function soplo({ dur = 0.15, vol = 0.15, filtro = 'lowpass', f = 1800, f2 = 0, q = 1, t = 0, bus = null } = {}) {
    if (!ctx) return;
    const t0 = t || ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = ruido;
    const fl = ctx.createBiquadFilter();
    fl.type = filtro;
    fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t0);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl).connect(g).connect(bus || busEfectos);
    s.start(t0, Math.random() * 0.5);
    s.stop(t0 + dur + 0.02);
  }

  // ---- Música: "Amanecer en el surco" (120 BPM, 8 compases en bucle) ----
  const CORCHEA = 60 / 120 / 2;
  // Melodía en onda cuadrada (números MIDI; 0 = silencio). 8 corcheas por compás.
  const MELODIA = [
    76, 0, 79, 0, 76, 74, 72, 0,
    72, 74, 76, 79, 81, 79, 76, 0,
    77, 0, 81, 0, 77, 76, 74, 0,
    74, 76, 77, 79, 77, 74, 71, 0,
    76, 0, 79, 0, 84, 0, 79, 76,
    81, 79, 76, 74, 76, 0, 72, 0,
    77, 81, 79, 77, 76, 74, 71, 74,
    72, 0, 67, 0, 72, 0, 0, 0,
  ];
  // Bajo tipo tololoche: tónica y quinta en negras (4 por compás). Acordes: C C F G C C F-G C.
  const BAJO = [
    48, 55, 48, 55, 48, 55, 48, 55,
    53, 60, 53, 60, 55, 62, 55, 62,
    48, 55, 48, 55, 48, 55, 48, 55,
    53, 60, 55, 62, 48, 55, 48, 48,
  ];
  let reloj = null, paso = 0, siguiente = 0;

  function programar() {
    if (!ctx) return;
    // Si la pestaña estuvo oculta, se retoma desde ahora en lugar de tocar todo junto.
    if (siguiente < ctx.currentTime - 0.3) siguiente = ctx.currentTime + 0.05;
    while (siguiente < ctx.currentTime + 0.12) {
      const i = paso % MELODIA.length;
      if (MELODIA[i]) tono(mtof(MELODIA[i]), { dur: CORCHEA * 0.9, vol: 0.05, t: siguiente, bus: busMusica });
      if (i % 2 === 0) {
        const b = BAJO[i / 2];
        if (b) tono(mtof(b), { dur: CORCHEA * 1.6, tipo: 'triangle', vol: 0.17, t: siguiente, bus: busMusica });
      } else {
        soplo({ dur: 0.03, vol: 0.035, filtro: 'highpass', f: 7000, t: siguiente, bus: busMusica });
      }
      siguiente += CORCHEA;
      paso++;
    }
  }

  function musica() {
    if (!ctx || reloj) return;
    paso = 0;
    siguiente = ctx.currentTime + 0.1;
    reloj = setInterval(programar, 25);
  }

  function musicaParar() {
    clearInterval(reloj);
    reloj = null;
  }

  function alternarMudo() {
    mudo = !mudo;
    if (maestro) maestro.gain.setTargetAtTime(mudo ? 0 : VOLUMEN, ctx.currentTime, 0.02);
    try { localStorage.setItem('cosechaHelada.mudo', mudo ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    return mudo;
  }

  return {
    iniciar, musica, musicaParar, alternarMudo,
    estaMudo: () => mudo,
    salto() { tono(320, { f2: 640, dur: 0.12, vol: 0.09 }); },
    manguera() { soplo({ dur: 0.08, vol: 0.1, filtro: 'bandpass', f: 2600, q: 0.7 }); },
    rociador() { soplo({ dur: 0.45, vol: 0.16, f: 3500, f2: 500 }); },
    caja() { const t = ahora(); tono(988, { dur: 0.07, vol: 0.08, t }); tono(1319, { dur: 0.14, vol: 0.08, t: t + 0.07 }); },
    secreta() { const t = ahora(); [784, 988, 1175, 1568, 1976].forEach((f, i) => tono(f, { dur: 0.1, vol: 0.08, t: t + i * 0.06 })); },
    entrega() {
      const t = ahora();
      [523, 659, 784, 1047].forEach((f, i) => tono(f, { dur: 0.09, vol: 0.08, t: t + i * 0.07 }));
      tono(1760, { dur: 0.05, vol: 0.05, t: t + 0.32 });
      tono(1760, { dur: 0.05, vol: 0.05, t: t + 0.4 });
    },
    item() { tono(440, { f2: 880, dur: 0.18, tipo: 'triangle', vol: 0.14 }); },
    cambio() { tono(660, { dur: 0.05, vol: 0.06 }); },
    danio() { tono(220, { f2: 70, dur: 0.25, tipo: 'sawtooth', vol: 0.12 }); soplo({ dur: 0.12, vol: 0.12, f: 900 }); },
    aturdir() { tono(700, { f2: 300, dur: 0.12, vol: 0.07 }); },
    derrota() { soplo({ dur: 0.22, vol: 0.14, filtro: 'bandpass', f: 1400, f2: 200, q: 1.2 }); tono(420, { f2: 90, dur: 0.18, tipo: 'triangle', vol: 0.12 }); },
    escupir() { tono(200, { f2: 120, dur: 0.08, vol: 0.05 }); },
    zumbido() { tono(180, { f2: 260, dur: 0.3, tipo: 'sawtooth', vol: 0.04 }); },
    agua() { soplo({ dur: 0.6, vol: 0.22, f: 1500, f2: 300 }); tono(300, { f2: 80, dur: 0.3, tipo: 'sine', vol: 0.12 }); },
    caida() { tono(500, { f2: 100, dur: 0.5, tipo: 'triangle', vol: 0.12 }); },
    checkpoint() { const t = ahora(); tono(1568, { dur: 0.06, vol: 0.06, t }); tono(1568, { dur: 0.06, vol: 0.06, t: t + 0.1 }); tono(2093, { dur: 0.12, vol: 0.06, t: t + 0.2 }); },
    desliz() { soplo({ dur: 0.18, vol: 0.07, f: 700 }); },
    blip() { tono(880, { dur: 0.04, vol: 0.04 }); },
    motor() { tono(55, { f2: 110, dur: 1.6, tipo: 'sawtooth', vol: 0.06 }); },
    victoria() {
      const t = ahora();
      [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.6], [84, 0.72]]
        .forEach(([m, d], i) => tono(mtof(m), { dur: i === 5 ? 0.6 : 0.14, vol: 0.09, t: t + d }));
    },
    perdiste() { const t = ahora(); [67, 65, 64, 62, 60].forEach((m, i) => tono(mtof(m), { dur: 0.22, tipo: 'triangle', vol: 0.12, t: t + i * 0.2 })); },
  };
})();
