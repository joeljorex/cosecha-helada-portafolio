// Arte del prototipo de Cosecha Helada.
// Todo se dibuja con código en lienzos pequeños (pixel art), así el juego no necesita archivos de imagen.
// Es arte provisional: en el Sprint 4 se cambia por los sprites hechos en Aseprite/LibreSprite.
const FUENTE = '"Press Start 2P", monospace';

const Arte = (() => {
  const C = {
    contorno: '#21160f',
    piel: '#e8b08a', pielS: '#c98b63',
    casco: '#ffd23f', cascoS: '#d9a400',
    overol: '#2f6fd6', overolS: '#1f4c9e',
    camisa: '#f2efe6', cabello: '#4a2a17', bota: '#6b4426',
    manguera: '#3fa34d', mangueraS: '#2a7a35',
  };

  function R(ctx, color, x, y, w = 1, h = 1) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function semilla(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  // Contorno oscuro de 1 px alrededor de lo dibujado dentro de un recuadro.
  function contorno(ctx, x0, y0, w, h, color = C.contorno) {
    const img = ctx.getImageData(x0, y0, w, h), d = img.data, marcas = [];
    const lleno = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (lleno(x, y)) continue;
        if (lleno(x - 1, y) || lleno(x + 1, y) || lleno(x, y - 1) || lleno(x, y + 1)) marcas.push((y * w + x) * 4);
      }
    }
    const [r, g, b] = rgb(color);
    for (const i of marcas) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
    ctx.putImageData(img, x0, y0);
  }

  // Crea una tira de n cuadros de w×h. dibujar(r, i) recibe r(color, x, y, w, h) ya desplazado al cuadro i.
  // Los cuadros quedan registrados como 'f0', 'f1', ...
  function tira(escena, clave, n, w, h, dibujar, conContorno = true) {
    const tex = escena.textures.createCanvas(clave, n * w, h);
    const ctx = tex.context;
    for (let i = 0; i < n; i++) {
      const ox = i * w;
      dibujar((c, x, y, ww = 1, hh = 1) => R(ctx, c, ox + x, y, ww, hh), i, ctx, ox);
      if (conContorno) contorno(ctx, ox, 0, w, h);
      tex.add('f' + i, 0, ox, 0, w, h);
    }
    tex.refresh();
    return tex;
  }

  // ---------- Personajes ----------

  // Poses de Luz: L y R = [desplazamiento x, cuánto se levanta el pie] de cada pierna; dy = rebote del torso.
  const POSES = [
    { L: [0, 0], R: [0, 0], dy: 0 },             // f0 quieta
    { L: [0, 0], R: [0, 0], dy: 1 },             // f1 respira
    { L: [-2, 0], R: [2, 0], dy: 0 },            // f2-f5 correr
    { L: [-1, 1], R: [1, 0], dy: -1 },
    { L: [2, 0], R: [-2, 0], dy: 0 },
    { L: [1, 0], R: [-1, 1], dy: -1 },
    { L: [-1, 2], R: [2, 1], dy: 0, brazo: -1 }, // f6 sube
    { L: [-2, 0], R: [1, 2], dy: 0, brazo: 1 },  // f7 cae
  ];

  function luz(r, p) {
    const d = p.dy, br = p.brazo || 0;
    r(C.overolS, 6 + p.L[0], 17, 2, 4 - p.L[1]); r(C.bota, 6 + p.L[0], 21 - p.L[1], 3, 2); // pierna de atrás
    r(C.overol, 8 + p.R[0], 17, 2, 4 - p.R[1]); r(C.bota, 8 + p.R[0], 21 - p.R[1], 3, 2);  // pierna de enfrente
    r(C.camisa, 4, 12 + d, 2, 3); r(C.piel, 4, 15 + d, 2, 1);                             // brazo de atrás
    r(C.camisa, 5, 11 + d, 6, 2);
    r(C.overol, 5, 13 + d, 6, 5);
    r(C.overol, 6, 11 + d, 1, 2); r(C.overol, 9, 11 + d, 1, 2);                           // tirantes
    r(C.overolS, 5, 16 + d, 6, 1);
    r(C.casco, 7, 14 + d, 2, 1);                                                          // botón
    r(C.piel, 5, 6 + d, 6, 5); r(C.pielS, 5, 10 + d, 6, 1);                               // cara
    r(C.cabello, 4, 6 + d, 2, 4); r(C.cabello, 3, 7 + d, 1, 4);                           // cola de caballo
    r('#20140c', 9, 8 + d); r('#e58a7a', 10, 9 + d);                                      // ojo y mejilla
    r(C.casco, 5, 2 + d, 6, 4); r(C.casco, 4, 4 + d, 8, 2); r(C.cascoS, 4, 5 + d, 9, 1);  // casco
    r('#fff3b0', 6, 3 + d, 2, 1);
    r(C.camisa, 9, 12 + d, 2, 2); r(C.piel, 11, 13 + d + br, 1, 2);                       // brazo con manguera
    r(C.manguera, 11, 12 + d + br, 3, 2); r(C.mangueraS, 13, 13 + d + br, 1, 1);
  }

  function luzDesliz(r) {
    r(C.bota, 1, 20, 2, 3);
    r(C.overol, 3, 18, 7, 4); r(C.overolS, 3, 21, 7, 1);
    r(C.camisa, 9, 17, 2, 4);
    r(C.piel, 11, 16, 3, 4); r('#20140c', 13, 17);
    r(C.cabello, 10, 16, 1, 3);
    r(C.casco, 11, 13, 4, 3); r(C.cascoS, 11, 15, 4, 1);
  }

  function tarimin(r, feliz) {
    r('#6d7480', 4, 3, 2, 14);                    // mástil
    r('#aab3bd', 1, 15, 7, 2);                    // horquillas
    r('#ffc21a', 6, 9, 17, 8); r('#e09a00', 6, 15, 17, 2);
    r('#2b2f3a', 8, 11, 4, 1); r('#2b2f3a', 8, 13, 4, 1);
    r('#2b2f3a', 13, 3, 10, 7); r('#7fe3ff', 14, 4, 8, 5);  // cabina y pantalla
    if (feliz) {
      r('#14303a', 15, 6); r('#14303a', 16, 5); r('#14303a', 17, 6);
      r('#14303a', 18, 6); r('#14303a', 19, 5); r('#14303a', 20, 6);
    } else {
      r('#14303a', 16, 5, 1, 2); r('#14303a', 19, 5, 1, 2);
    }
    r('#14303a', 17, 8, 2, 1);
    r('#6d7480', 20, 2, 1, 1); r(feliz ? '#80ce57' : '#ff4b3e', 19, 1, 3, 1);  // antena
    r('#2b2f3a', 7, 16, 5, 4); r('#2b2f3a', 17, 16, 5, 4);                    // ruedas
    r('#8a8f96', 9, 17, 1, 2); r('#8a8f96', 19, 17, 1, 2);
  }

  function gusano(r, v) {
    const sx = v === 1 ? 1 : 0;
    r('#8d9098', 4, 6, 6, 11);
    r('#6c6f77', 4, 9, 6, 1); r('#6c6f77', 4, 12, 6, 1); r('#6c6f77', 4, 15, 6, 1);
    r('#a9acb3', 4 + sx, 3, 6, 4); r('#a9acb3', 5 + sx, 2, 4, 1);
    if (v === 2) { // aturdido
      r('#20140c', 5 + sx, 4); r('#20140c', 8 + sx, 4);
      r('#ffd23f', 2, 1); r('#ffd23f', 11, 2); r('#ffd23f', 12, 6);
    } else {
      r('#ff3b30', 5 + sx, 4); r('#ff3b30', 8 + sx, 4);
    }
    r('#3a1d1d', 6 + sx, 5, 2, 1);
  }

  function mosca(r, v) {
    if (v === 0) { r('#d8eefc', 4, 1, 4, 3); r('#d8eefc', 8, 2, 3, 2); }
    else { r('#d8eefc', 3, 4, 5, 1); r('#d8eefc', 8, 4, 4, 1); }
    r('#55575e', 3, 5, 8, 4); r('#6f727a', 4, 6, 3, 1);
    r('#43454b', 11, 5, 3, 3); r('#ff3b30', 12, 5, 2, 2);
    r('#2b2b2b', 5, 9); r('#2b2b2b', 8, 9);
  }

  // ---------- Objetos ----------

  function caja(r, secreta) {
    const m = secreta ? '#e8b923' : '#b0713a', s = secreta ? '#b8860b' : '#7f4f26';
    if (secreta) {
      r('#fff6c0', 5, 2, 2, 2); r('#fff6c0', 9, 3, 2, 2); r('#ffffff', 7, 1);
    } else {
      r('#4f9a33', 3, 2, 4, 3); r('#6cc04a', 4, 2, 2, 1);   // calabacitas
      r('#e2412f', 8, 2, 2, 3); r('#4f9a33', 8, 1);         // chile
      r('#ff9a3c', 10, 3, 3, 2);                             // naranja
    }
    r(m, 2, 5, 12, 8);
    r(s, 2, 8, 12, 1); r(s, 2, 12, 12, 1); r(s, 2, 5, 1, 8); r(s, 13, 5, 1, 8);
  }

  function crearPersonajesYObjetos(escena) {
    tira(escena, 'luz', 9, 16, 24, (r, i) => (i < 8 ? luz(r, POSES[i]) : luzDesliz(r)));
    tira(escena, 'tarimin', 2, 28, 21, (r, i) => tarimin(r, i === 1));
    tira(escena, 'gusano', 3, 14, 18, gusano);
    tira(escena, 'mosca', 2, 16, 12, mosca);
    tira(escena, 'caja', 1, 16, 14, r => caja(r, false));
    tira(escena, 'cajaSecreta', 1, 16, 14, r => caja(r, true));

    tira(escena, 'tanque', 1, 12, 16, r => {
      r('#2a7a35', 4, 2, 4, 2); r('#3fa34d', 3, 4, 6, 10);
      r('#7fd18a', 4, 5, 1, 8); r('#e8ffe0', 6, 8, 2, 2); r('#e8ffe0', 7, 7);
    });
    tira(escena, 'botiquin', 1, 14, 12, r => {
      r('#9aa3ae', 5, 1, 4, 2); r('#f4f4f4', 2, 3, 10, 8);
      r('#e23b3b', 6, 4, 2, 6); r('#e23b3b', 4, 6, 6, 2);
    });
    tira(escena, 'letrero', 1, 20, 24, r => {
      r('#7a4b2a', 9, 10, 2, 13);
      r('#c58a4c', 2, 3, 16, 8); r('#e0a865', 2, 3, 16, 1); r('#9a6534', 2, 10, 16, 1);
      r('#5a3519', 4, 5, 1, 1); r('#5a3519', 15, 5, 1, 1);
      r('#5a3519', 5, 7, 10, 1);
    });
    tira(escena, 'monticulo', 1, 20, 7, r => {
      r('#7a4b2a', 2, 2, 16, 4); r('#2a160b', 5, 3, 10, 2); r('#8d5a33', 3, 1, 14, 1);
    });
    tira(escena, 'corazon', 2, 11, 10, (r, i) => {
      const forma = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
      forma.forEach((fila, y) => [...fila].forEach((ch, x) => { if (ch === '#') r(i ? '#5a2d3f' : '#ff4b5c', 1 + x, 1 + y); }));
      if (!i) r('#ffb3bd', 2, 2, 2, 1);
    });
    tira(escena, 'bolita', 1, 8, 8, r => { r('#7d7f86', 2, 2, 4, 4); r('#a5a7ad', 3, 2, 2, 1); });
    tira(escena, 'gota', 1, 8, 6, r => { r('#5fb8f0', 1, 1, 6, 4); r('#bfe9ff', 2, 1, 4, 2); r('#ffffff', 5, 2); }, false);
    tira(escena, 'saguaro', 1, 18, 36, r => {
      r('#3f8a45', 7, 3, 5, 32); r('#5aa860', 8, 4, 1, 30);
      r('#3f8a45', 3, 13, 3, 8); r('#3f8a45', 5, 19, 3, 2);
      r('#3f8a45', 13, 8, 3, 9); r('#3f8a45', 11, 15, 3, 2);
      r('#2f6b35', 10, 6, 1, 28);
    });
    tira(escena, 'arbusto', 1, 20, 10, r => {
      r('#5d8a3a', 3, 4, 14, 5); r('#5d8a3a', 5, 2, 5, 3); r('#5d8a3a', 11, 3, 4, 2); r('#7aa84e', 6, 3, 2, 1);
    });

    // Nube del rociador y "puff" al derrotar a una plaga (sin contorno, con transparencia).
    tira(escena, 'nube', 1, 48, 36, (r, i, ctx, ox) => {
      ctx.fillStyle = 'rgba(128, 206, 87, 0.75)';
      [[14, 20, 11], [24, 14, 12], [34, 20, 11], [24, 24, 10]].forEach(([x, y, rad]) => {
        ctx.beginPath(); ctx.arc(ox + x, y, rad, 0, Math.PI * 2); ctx.fill();
      });
    }, false);
    tira(escena, 'puff', 1, 24, 24, (r, i, ctx, ox) => {
      ctx.fillStyle = 'rgba(222, 224, 230, 0.9)';
      [[8, 12, 6], [16, 10, 6], [12, 16, 6]].forEach(([x, y, rad]) => {
        ctx.beginPath(); ctx.arc(ox + x, y, rad, 0, Math.PI * 2); ctx.fill();
      });
    }, false);

    // Tarima que sube y baja (3 celdas de ancho).
    tira(escena, 'tarimaMovil', 1, 48, 8, r => {
      r('#c58a4c', 0, 0, 48, 3); r('#e0a865', 0, 0, 48, 1); r('#7f5129', 0, 3, 48, 1);
      [1, 7, 13, 17, 23, 29, 33, 39, 45].forEach(x => r('#a86f3a', x, 4, 2, 3));
    }, false);

    // Camión refrigerado: puertas atrás (izquierda) y cabina adelante (derecha).
    const camion = tira(escena, 'camion', 1, 112, 53, r => {
      r('#f3f6f8', 2, 6, 74, 36); r('#d5dde3', 2, 38, 74, 4); r('#2f6fd6', 2, 30, 74, 4);
      r('#c3ccd3', 2, 6, 2, 36); r('#9aa6af', 4, 12, 1, 4); r('#9aa6af', 4, 28, 1, 4);
      r('#8a949c', 64, 1, 12, 5);
      r('#3a3f47', 2, 42, 104, 4);
      r('#e2412f', 78, 18, 26, 24); r('#e2412f', 78, 14, 14, 4); r('#b52f21', 78, 36, 26, 6);
      r('#9fe0ff', 88, 21, 12, 9); r('#ffd23f', 101, 34, 3, 3);
      [10, 26, 86].forEach(x => { r('#1e2126', x, 42, 10, 10); r('#8a8f96', x + 3, 45, 4, 4); });
    });
    const cctx = camion.context;
    cctx.fillStyle = '#2f6fd6';
    cctx.font = '8px "Press Start 2P", monospace';
    cctx.textBaseline = 'top';
    cctx.fillText('FRÍO DEL', 8, 12);
    cctx.fillText('DESIERTO', 8, 21);
    camion.refresh();
  }

  // ---------- Tiles del mapa (16×16) ----------
  // 0 pasto · 1 tierra · 2 concreto · 3 tarima · 4 agua (superficie) · 5 agua · 6 paca · 7 surco
  function crearTiles(escena) {
    const tex = escena.textures.createCanvas('tiles', 16 * 8, 16);
    const ctx = tex.context, rnd = semilla(7);
    const r = (c, x, y, w = 1, h = 1) => R(ctx, c, x, y, w, h);
    const tierra = ox => {
      r('#7a4b2a', ox, 0, 16, 16);
      for (let i = 0; i < 14; i++) r(rnd() < 0.5 ? '#6a3f22' : '#8d5a33', ox + Math.floor(rnd() * 15), Math.floor(rnd() * 16), 2, 1);
    };
    tierra(0);
    r('#4f9a33', 0, 0, 16, 4); r('#6cc04a', 0, 0, 16, 1); r('#3b7a26', 0, 4, 16, 1);
    for (let x = 1; x < 16; x += 3) r('#6cc04a', x, 1, 1, 2);
    tierra(16);
    r('#8e949b', 32, 0, 16, 16); r('#b4bac0', 32, 0, 16, 2); r('#6f757c', 32, 15, 16, 1);
    r('#6f757c', 36, 5, 1, 4); r('#6f757c', 37, 9, 2, 1); r('#6f757c', 42, 11, 1, 3);
    r('#c58a4c', 48, 0, 16, 3); r('#e0a865', 48, 0, 16, 1); r('#7f5129', 48, 3, 16, 1);
    r('#a86f3a', 49, 4, 3, 3); r('#a86f3a', 55, 4, 3, 3); r('#a86f3a', 60, 4, 3, 3);
    r('#3d8fd6', 64, 3, 16, 13); r('#9ad7ff', 64, 3, 16, 1);
    r('#bfe9ff', 66, 2, 3, 1); r('#bfe9ff', 74, 2, 3, 1); r('#5fb0ec', 68, 8, 5, 1);
    r('#2c6fb3', 80, 0, 16, 16); r('#3d8fd6', 83, 5, 6, 1); r('#3d8fd6', 88, 11, 5, 1);
    r('#e2bf55', 96, 0, 16, 16); r('#a37b2c', 96, 15, 16, 1);
    for (let i = 0; i < 10; i++) r('#c49a35', 96 + Math.floor(rnd() * 14), Math.floor(rnd() * 14), 2, 1);
    r('#8a5a2b', 96, 4, 16, 1); r('#8a5a2b', 96, 11, 16, 1);
    tierra(112);
    r('#5a3519', 112, 0, 16, 3);
    for (let x = 0; x < 16; x += 4) { r('#8d5a33', 112 + x, 0, 2, 2); r('#6cc04a', 113 + x, 0, 1, 1); }
    for (let i = 0; i < 8; i++) tex.add('t' + i, 0, i * 16, 0, 16, 16);
    tex.refresh();
  }

  // ---------- Fondo con parallax ----------
  function crearFondo(escena) {
    const cielo = escena.textures.createCanvas('cielo', 640, 360);
    const g = cielo.context.createLinearGradient(0, 0, 0, 360);
    g.addColorStop(0, '#2a1f4f'); g.addColorStop(0.45, '#8f3f6b'); g.addColorStop(0.75, '#f0784a'); g.addColorStop(1, '#ffcf7a');
    cielo.context.fillStyle = g;
    cielo.context.fillRect(0, 0, 640, 360);
    cielo.refresh();

    const sol = escena.textures.createCanvas('sol', 80, 80);
    const gs = sol.context.createRadialGradient(40, 40, 10, 40, 40, 40);
    gs.addColorStop(0, '#fff2b8'); gs.addColorStop(0.45, '#ffe08a'); gs.addColorStop(0.5, 'rgba(255, 210, 120, 0.45)'); gs.addColorStop(1, 'rgba(255, 200, 120, 0)');
    sol.context.fillStyle = gs;
    sol.context.fillRect(0, 0, 80, 80);
    sol.refresh();

    // Siluetas que se repiten sin cortes cada 640 px (funciones periódicas).
    const P = 2 * Math.PI / 640;
    const silueta = (clave, alto, color, borde, altura) => {
      const tex = escena.textures.createCanvas(clave, 640, alto);
      for (let x = 0; x < 640; x++) {
        const h = Math.round(altura(x));
        R(tex.context, color, x, alto - h, 1, h);
        R(tex.context, borde, x, alto - h, 1, 1);
      }
      return tex;
    };
    silueta('cerros', 150, '#7d4d6e', '#9a6383',
      x => 70 + 22 * Math.sin(x * P * 2 + 0.5) + 12 * Math.sin(x * P * 5 + 1.3) + 6 * Math.sin(x * P * 11)).refresh();
    const lomas = silueta('lomas', 110, '#55344d', '#6b4361',
      x => 40 + 12 * Math.sin(x * P * 3 + 2) + 6 * Math.sin(x * P * 7 + 0.4));
    [[70, 30], [230, 24], [400, 34], [560, 27]].forEach(([x, h]) => {
      const base = 110 - (40 + 12 * Math.sin(x * P * 3 + 2) + 6 * Math.sin(x * P * 7 + 0.4));
      R(lomas.context, '#3f2638', x, base - h, 4, h + 2);
      R(lomas.context, '#3f2638', x - 5, base - h + 9, 3, 9); R(lomas.context, '#3f2638', x - 3, base - h + 16, 3, 2);
      R(lomas.context, '#3f2638', x + 6, base - h + 5, 3, 8); R(lomas.context, '#3f2638', x + 4, base - h + 11, 2, 2);
    });
    lomas.refresh();
  }

  function crearAnimaciones(escena) {
    const A = escena.anims;
    const cuadros = (clave, ns) => ns.map(n => ({ key: clave, frame: 'f' + n }));
    if (A.exists('luz-quieta')) return;
    A.create({ key: 'luz-quieta', frames: cuadros('luz', [0, 1]), frameRate: 2, repeat: -1 });
    A.create({ key: 'luz-corre', frames: cuadros('luz', [2, 3, 4, 5]), frameRate: 12, repeat: -1 });
    A.create({ key: 'gusano-mueve', frames: cuadros('gusano', [0, 1]), frameRate: 4, repeat: -1 });
    A.create({ key: 'mosca-vuela', frames: cuadros('mosca', [0, 1]), frameRate: 18, repeat: -1 });
  }

  function crearTodo(escena) {
    crearPersonajesYObjetos(escena);
    crearTiles(escena);
    crearFondo(escena);
    crearAnimaciones(escena);
  }

  return { crearTodo };
})();
