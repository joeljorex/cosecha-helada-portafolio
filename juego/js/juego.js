// Escena principal: Nivel 1 · El Campo.
// Puntaje según el GDD §17: eventos × combo + entregas + bono de tiempo + bono sin daño − golpes − vidas perdidas.
const COMBO = [1, 1.5, 2, 3];
const VEL = { correr: 140, salto: 330, corteSalto: 150, deslizar: 230, gota: 380, bolita: 150, tarima: 32 };

const DIALOGO_INTRO = [
  { quien: 'LUZ', color: '#ffd23f', txt: 'Otra temporada récord, Tarimín. Hoy no se nos escapa ni una calabacita.' },
  { quien: 'DR. CENIZA', color: '#c9c9d3', txt: '¡Ja, ja! ¡Que disfruten su última cosecha! ¡Mi plaga va a dejar este valle en cenizas!', temblor: true },
  { quien: 'DON CHUY', color: '#ffa73e', txt: '¡Luz! ¡Se nos va la cosecha! Hay que meter todo al túnel antes de que anochezca.' },
  { quien: 'LUZ', color: '#ffd23f', txt: 'Entonces no hay tiempo que perder. ¿Listo, compañero?' },
  { quien: 'TARIMÍN', color: '#7fe3ff', txt: '¡Bip-bip! (Traducción: "¡Listo! ¡A congelar plagas! Te espero junto al canal.")' },
];

class EscenaJuego extends Phaser.Scene {
  constructor() { super('Juego'); }

  create() {
    this.N = Nivel1.crear();
    this.anchoMundo = Nivel1.ANCHO * Nivel1.T;
    this.ySuelo = Nivel1.SUELO * Nivel1.T;
    this.estado = 'dialogo';
    Object.assign(this, {
      corazones: 3, vidas: 3, arma: 'manguera', municion: 0,
      coyote: 0, bufferSalto: 0, invul: 0, empuje: 0, desliz: 0, cdDisparo: 0, mira: 1,
      tiempo: 0, enMano: 0, entregadas: 0, cajasNormales: 0, secreta: false,
      ptsCajas: 0, ptsEntregas: 0, ptsEnemigos: 0, golpes: 0, vidasPerdidas: 0,
      comboIdx: 0, ultimoDerribo: -10, derrotados: { gusano: 0, mosca: 0 },
      prevSalto: false, prevAbajo: false, gotas: [], bolitas: [],
    });

    this.crearFondo();
    this.crearMapa();
    this.crearObjetos();
    this.crearJugador();
    this.crearHUD();

    this.teclas = this.input.keyboard.addKeys('W,A,S,D,J,K,P,UP,DOWN,LEFT,RIGHT,SPACE,ENTER,ESC');
    // Las acciones de un solo toque se guardan desde el evento keydown para no perder pulsaciones muy rápidas.
    this.pend = {};
    const alTecla = e => {
      if (e.repeat) return;
      const c = e.code;
      if (c === 'Escape') { this.pend.saltarIntro = true; this.pend.pausa = true; }
      if (c === 'KeyP') this.pend.pausa = true;
      if (c === 'Enter' || c === 'Space' || c === 'KeyJ') this.pend.avanzar = true;
      if (c === 'Space' || c === 'KeyW' || c === 'ArrowUp') this.pend.salto = true;
      if (c === 'KeyS' || c === 'ArrowDown') this.pend.abajo = true;
      if (c === 'KeyJ') this.pend.disparo = true;
      if (c === 'KeyK') this.pend.cambiar = true;
    };
    const alReanudar = () => { Object.values(this.teclas).forEach(k => k.reset()); this.prevSalto = true; this.pend = {}; };
    this.input.keyboard.on('keydown', alTecla);
    this.events.on('resume', alReanudar);
    this.events.once('shutdown', () => { this.events.off('resume', alReanudar); this.input.keyboard.off('keydown', alTecla); });

    limpiarToques();
    this.cameras.main.fadeIn(400);
    this.iniciarDialogo();
  }

  // ---------- Construcción ----------

  crearFondo() {
    this.add.image(0, 0, 'cielo').setOrigin(0).setScrollFactor(0).setDepth(-20);
    this.add.image(500, 150, 'sol').setScrollFactor(0).setDepth(-19);
    this.cerros = this.add.tileSprite(0, 160, 640, 150, 'cerros').setOrigin(0).setScrollFactor(0).setDepth(-18);
    this.lomas = this.add.tileSprite(0, 214, 640, 110, 'lomas').setOrigin(0).setScrollFactor(0).setDepth(-17);
    let s = 11;
    const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let c = 8; c < Nivel1.ANCHO - 26; c += 6 + Math.floor(azar() * 8)) {
      if (c >= 106 && c <= 136) continue; // canal
      this.add.image(c * 16 + 8, this.ySuelo + 2, azar() < 0.35 ? 'saguaro' : 'arbusto').setOrigin(0.5, 1).setDepth(8);
    }
  }

  crearMapa() {
    const mapa = this.make.tilemap({ data: this.N.grid, tileWidth: 16, tileHeight: 16 });
    const ts = mapa.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0);
    this.capa = mapa.createLayer(0, ts, 0, 0).setDepth(10);
    this.capa.setCollision(Nivel1.SOLIDOS);
    // Las tarimas solo detienen al jugador cuando cae desde arriba.
    this.capa.forEachTile(t => { if (t.index === Nivel1.TARIMA) t.setCollision(false, false, true, false); });
    this.physics.world.setBounds(0, 0, this.anchoMundo, 720);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.cameras.main.setBounds(0, 0, this.anchoMundo, 360);
  }

  crearObjetos() {
    const N = this.N, T = 16, S = this.ySuelo;
    this.estiloLetrero = { fontFamily: FUENTE, fontSize: '8px', color: '#fff8e1', stroke: '#2b1a10', strokeThickness: 3, align: 'center', lineSpacing: 4 };

    N.letreros.forEach(l => {
      const x = l.c * T + 8;
      this.add.image(x, S + 1, 'letrero').setOrigin(0.5, 1).setDepth(9);
      this.add.text(x, S - 30, l.texto, this.estiloLetrero).setOrigin(0.5, 1).setDepth(30);
    });

    const flotar = img => this.tweens.add({ targets: img, y: img.y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const poner = (o, clave) => this.add.image(o.c * T + 8, (o.f + 1) * T, clave).setOrigin(0.5, 1).setDepth(14);

    this.cajas = N.cajas.map(o => ({ img: poner(o, 'caja'), secreta: false, tomada: false }));
    const secreta = poner(N.secreta, 'cajaSecreta');
    this.tweens.add({ targets: secreta, alpha: 0.7, duration: 300, yoyo: true, repeat: -1 });
    this.cajas.push({ img: secreta, secreta: true, tomada: false });
    this.cajas.forEach(c => flotar(c.img));
    this.totalNormales = N.cajas.length;

    this.items = [
      { tipo: 'tanque', img: poner(N.tanque, 'tanque'), tomado: false },
      { tipo: 'botiquin', img: poner(N.botiquin, 'botiquin'), tomado: false },
    ];
    this.items.forEach(i => flotar(i.img));

    // Plagas
    this.enemigos = [];
    N.gusanos.forEach((c, i) => {
      const x = c * T + 8;
      this.add.image(x, S + 2, 'monticulo').setOrigin(0.5, 1).setDepth(11);
      const s = this.add.sprite(x, S + 18, 'gusano', 'f0').setOrigin(0.5, 1).setDepth(5).play('gusano-mueve');
      this.enemigos.push({ tipo: 'gusano', s, x, hp: 2, vivo: true, fase: 'oculto', t: i * 0.7, aturdido: 0, disparo: false });
    });
    N.moscas.forEach((m, i) => {
      const x0 = m.c * T + 8, y0 = m.f * T + 8;
      const s = this.add.sprite(x0, y0, 'mosca', 'f0').setDepth(25).play('mosca-vuela');
      this.enemigos.push({ tipo: 'mosca', s, x0, y0, rango: m.rango, hp: 1, vivo: true, fase: 'patrulla', t: i * 1.3, cd: 0 });
    });

    // Tarima flotante del canal: sube y baja 64 px cada 2 s.
    const tm = N.tarimaMovil;
    this.tarimaMovil = this.physics.add.image(tm.c * T, tm.fAbajo * T, 'tarimaMovil').setOrigin(0, 0).setDepth(12);
    const b = this.tarimaMovil.body;
    b.setAllowGravity(false);
    b.setImmovable(true);
    b.checkCollision.down = false;
    b.checkCollision.left = false;
    b.checkCollision.right = false;
    b.setVelocityY(-VEL.tarima);
    this.tmLimites = { arriba: tm.fArriba * T, abajo: tm.fAbajo * T };

    // Tarimín: punto de control. Guarda las cajas que llevas.
    this.checkpoints = N.checkpoints.map(c => ({ x: c * T + 8, activo: false }));
    this.respawn = { x: N.jugador.c * T + 8 };
    this.idxTarimin = 0;
    this.tarimin = this.add.sprite(this.checkpoints[0].x + 10, S, 'tarimin', 'f0').setOrigin(0.5, 1).setDepth(15);
    this.tweens.add({ targets: this.tarimin, y: S - 1, duration: 300, yoyo: true, repeat: -1 });
    this.txtCP = this.add.text(this.tarimin.x, S - 30, 'PUNTO DE\nCONTROL', this.estiloLetrero).setOrigin(0.5, 1).setDepth(30);

    this.camion = this.add.image(N.camion.c * T, S, 'camion').setOrigin(0, 1).setDepth(13);
    this.add.text(this.camion.x + 40, S - 60, 'META', { ...this.estiloLetrero, color: '#ffd23f' }).setOrigin(0.5, 1).setDepth(30);
  }

  crearJugador() {
    const j = this.physics.add.sprite(this.respawn.x, this.ySuelo, 'luz', 'f0').setOrigin(0.5, 1).setDepth(20);
    j.body.setSize(10, 22, false).setOffset(3, 2);
    j.body.setMaxVelocity(400, 520);
    j.setCollideWorldBounds(true);
    this.physics.add.collider(j, this.capa);
    this.physics.add.collider(j, this.tarimaMovil);
    this.jugador = j;
    this.cameras.main.startFollow(j, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(40, 80);
  }

  crearHUD() {
    const est = color => ({ fontFamily: FUENTE, fontSize: '8px', color, stroke: '#140c1c', strokeThickness: 3 });
    const fijo = o => o.setScrollFactor(0).setDepth(100);
    fijo(this.add.rectangle(0, 0, 640, 20, 0x140c1c, 0.55).setOrigin(0));
    fijo(this.add.rectangle(0, 344, 640, 16, 0x140c1c, 0.55).setOrigin(0));
    this.iconosCorazon = [0, 1, 2].map(i => fijo(this.add.image(12 + i * 13, 10, 'corazon', 'f0')));
    this.txtVidas = fijo(this.add.text(52, 6, '', est('#ffffff')));
    this.txtPuntos = fijo(this.add.text(320, 6, '', est('#ffd23f')).setOrigin(0.5, 0));
    this.txtArma = fijo(this.add.text(632, 6, '', est('#9ad7ff')).setOrigin(1, 0));
    this.txtCombo = fijo(this.add.text(320, 26, '', est('#ffa73e')).setOrigin(0.5, 0));
    this.txtCajas = fijo(this.add.text(8, 349, '', est('#ffffff')));
    this.txtTiempo = fijo(this.add.text(632, 349, '', est('#ffffff')).setOrigin(1, 0));
    this.txtAviso = fijo(this.add.text(320, 64, '', { ...est('#ffffff'), align: 'center' }).setOrigin(0.5).setAlpha(0));
    this.actualizarHUD();
  }

  // ---------- Diálogo de entrada (guion del GDD §14) ----------

  iniciarDialogo() {
    this.physics.pause();
    this.idxLinea = 0;
    const fijo = o => o.setScrollFactor(0).setDepth(110);
    const est = { fontFamily: FUENTE, fontSize: '8px', color: '#ffffff' };
    this.objDialogo = [
      fijo(this.add.rectangle(20, 248, 600, 88, 0x140c1c, 0.97).setOrigin(0).setStrokeStyle(2, 0xffd23f)),
      (this.txtQuien = fijo(this.add.text(36, 260, '', est))),
      (this.txtLinea = fijo(this.add.text(36, 280, '', { ...est, wordWrap: { width: 568 }, lineSpacing: 6 }))),
      (this.txtSigue = fijo(this.add.text(604, 322, 'ENTER ▶', { ...est, color: '#ffa73e' }).setOrigin(1, 0))),
      fijo(this.add.text(604, 232, 'ESC: saltar la intro', { ...est, stroke: '#140c1c', strokeThickness: 3 }).setOrigin(1, 0)),
    ];
    this.tweens.add({ targets: this.txtSigue, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    this.input.on('pointerdown', this.avanzarDialogo, this);
    this.mostrarLinea();
  }

  mostrarLinea() {
    const l = DIALOGO_INTRO[this.idxLinea];
    this.txtQuien.setText(l.quien).setColor(l.color);
    this.txtLinea.setText(l.txt);
    if (l.temblor) this.cameras.main.shake(350, 0.008);
    Sonido.blip();
  }

  avanzarDialogo() {
    if (this.estado !== 'dialogo') return;
    this.idxLinea++;
    if (this.idxLinea >= DIALOGO_INTRO.length) this.cerrarDialogo();
    else this.mostrarLinea();
  }

  cerrarDialogo() {
    this.objDialogo.forEach(o => o.destroy());
    this.input.off('pointerdown', this.avanzarDialogo, this);
    this.estado = 'jugando';
    this.prevSalto = true; // que la tecla que cerró el diálogo no haga saltar
    this.physics.resume();
    this.aviso('¡Rescata la cosecha y llévala al camión!');
  }

  actualizarDialogo() {
    if (this.pend.saltarIntro || tomarToque('pausa')) { this.cerrarDialogo(); return; }
    if (this.pend.avanzar || tomarToque('saltar', 'disparar')) this.avanzarDialogo();
  }

  // ---------- Ciclo del juego ----------

  update(_, delta) {
    this.paso(Math.min(delta / 1000, 0.05));
    this.pend = {}; // las pulsaciones de un solo toque se usan en un solo cuadro
  }

  paso(dt) {
    const cx = this.cameras.main.scrollX;
    this.cerros.tilePositionX = cx * 0.1;
    this.lomas.tilePositionX = cx * 0.25;

    if (this.estado === 'dialogo') { this.actualizarDialogo(); return; }
    if (this.estado !== 'jugando') { this.actualizarHUD(); return; }

    const c = this.leerControles();
    if (c.pausa) { this.scene.launch('Pausa'); this.scene.pause(); return; }

    this.tiempo += dt;
    this.actualizarJugador(dt, c);
    this.actualizarTarima();
    this.actualizarEnemigos(dt);
    this.actualizarProyectiles(dt);
    this.revisarRecogidas();
    this.revisarCheckpoints();
    this.revisarPeligros();
    this.actualizarHUD();
  }

  // Teclado + botones táctiles (window.TACTIL lo llena main.js). "cambiar" y "pausa" son de un solo toque.
  leerControles() {
    const k = this.teclas, t = window.TACTIL || {}, p = this.pend;
    const salto = k.SPACE.isDown || k.W.isDown || k.UP.isDown || !!t.saltar;
    const abajo = k.DOWN.isDown || k.S.isDown || !!t.abajo;
    const toqueSalto = tomarToque('saltar');
    const c = {
      izq: k.LEFT.isDown || k.A.isDown || !!t.izq,
      der: k.RIGHT.isDown || k.D.isDown || !!t.der,
      salto: salto || !!p.salto || toqueSalto,
      saltoNuevo: (salto && !this.prevSalto) || !!p.salto || toqueSalto,
      abajoNuevo: (abajo && !this.prevAbajo) || !!p.abajo || tomarToque('abajo'),
      disparo: k.J.isDown || !!t.disparar || !!p.disparo || tomarToque('disparar'),
      cambiar: !!p.cambiar || tomarToque('cambiar'),
      pausa: !!p.pausa || tomarToque('pausa'),
    };
    this.prevSalto = salto;
    this.prevAbajo = abajo;
    return c;
  }

  actualizarJugador(dt, c) {
    const j = this.jugador, b = j.body;
    const enSuelo = b.blocked.down || b.touching.down;
    this.coyote = enSuelo ? 0.1 : this.coyote - dt;           // margen para saltar justo al salir de una orilla
    this.bufferSalto = c.saltoNuevo ? 0.12 : this.bufferSalto - dt; // salto presionado un poco antes de tocar suelo
    this.invul = Math.max(0, this.invul - dt);
    this.empuje = Math.max(0, this.empuje - dt);
    this.cdDisparo -= dt;

    const dir = (c.der ? 1 : 0) - (c.izq ? 1 : 0);
    if (this.desliz > 0) {
      this.desliz -= dt;
      if (this.desliz <= 0 || !enSuelo) this.terminarDesliz();
    } else if (this.empuje <= 0) {
      const objetivo = dir * VEL.correr;
      const k = enSuelo ? 14 : 7;
      b.setVelocityX(b.velocity.x + (objetivo - b.velocity.x) * Math.min(1, k * dt));
      if (dir) this.mira = dir;
      if (c.abajoNuevo && enSuelo && Math.abs(b.velocity.x) > 60) this.iniciarDesliz();
    }

    if (this.bufferSalto > 0 && this.coyote > 0 && this.desliz <= 0) {
      b.setVelocityY(-VEL.salto);
      this.coyote = 0;
      this.bufferSalto = 0;
      Sonido.salto();
    }
    if (!c.salto && b.velocity.y < -VEL.corteSalto) b.setVelocityY(-VEL.corteSalto); // salto variable

    if (c.cambiar) this.cambiarArma();
    if (c.disparo && this.cdDisparo <= 0 && this.desliz <= 0) this.disparar();

    if (this.desliz > 0) { j.anims.stop(); j.setFrame('f8'); }
    else if (!enSuelo) { j.anims.stop(); j.setFrame(b.velocity.y < 0 ? 'f6' : 'f7'); }
    else if (Math.abs(b.velocity.x) > 25) j.anims.play('luz-corre', true);
    else j.anims.play('luz-quieta', true);
    j.setFlipX(this.mira < 0);
    j.setAlpha(this.invul > 0 && Math.floor(this.invul * 14) % 2 === 0 ? 0.35 : 1);
  }

  iniciarDesliz() {
    this.desliz = 0.42;
    this.jugador.body.setSize(12, 10, false).setOffset(2, 14);
    this.jugador.body.setVelocityX(this.mira * VEL.deslizar);
    Sonido.desliz();
  }

  terminarDesliz() {
    if (this.desliz === 0 && this.jugador.body.height === 22) return;
    this.desliz = 0;
    this.jugador.body.setSize(10, 22, false).setOffset(3, 2);
  }

  cambiarArma() {
    if (this.arma === 'rociador') { this.arma = 'manguera'; Sonido.cambio(); return; }
    if (this.municion > 0) { this.arma = 'rociador'; Sonido.cambio(); }
    else this.aviso('Necesitas un tanque verde\npara usar el rociador');
  }

  disparar() {
    const j = this.jugador, y = j.y - 12;
    if (this.arma === 'manguera') {
      this.cdDisparo = 0.22;
      const img = this.add.image(j.x + this.mira * 10, y, 'gota').setDepth(19).setFlipX(this.mira < 0);
      this.gotas.push({ img, vx: this.mira * VEL.gota, vida: 0.42 });
      Sonido.manguera();
      return;
    }
    // Rociador orgánico: nube en área que daña a varias plagas a la vez.
    this.municion--;
    this.cdDisparo = 0.6;
    const nx = j.x + this.mira * 28;
    const nube = this.add.image(nx, y, 'nube').setDepth(19).setAlpha(0.9);
    this.tweens.add({ targets: nube, scale: 1.4, alpha: 0, duration: 450, onComplete: () => nube.destroy() });
    Sonido.rociador();
    const area = { x: nx - 26, y: y - 22, w: 52, h: 40 };
    this.enemigos.forEach(e => { if (e.vivo && this.golpeable(e) && this.solapa(area, this.cajaEnemigo(e))) this.golpearEnemigo(e, 2); });
    if (this.municion <= 0) { this.arma = 'manguera'; this.aviso('Se acabó el tanque:\nvuelves a la manguera'); }
  }

  actualizarTarima() {
    const t = this.tarimaMovil;
    if (t.y <= this.tmLimites.arriba) t.body.setVelocityY(VEL.tarima);
    else if (t.y >= this.tmLimites.abajo) t.body.setVelocityY(-VEL.tarima);
  }

  // ---------- Plagas ----------

  actualizarEnemigos(dt) {
    const pj = this.cajaJugador();
    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      if (e.tipo === 'gusano') this.actualizarGusano(e, dt);
      else this.actualizarMosca(e, dt);
      if (this.peligroso(e) && this.solapa(pj, this.cajaEnemigo(e))) this.recibirDanio(e.s.x);
    }
  }

  // Gusano ceniza: sale del surco cada 3 s y escupe una bolita en línea recta.
  actualizarGusano(e, dt) {
    const S = this.ySuelo, j = this.jugador;
    if (e.aturdido > 0) {
      e.aturdido -= dt;
      e.s.anims.stop();
      e.s.setFrame('f2');
      e.s.x = e.x + Math.sin(this.tiempo * 30);
      if (e.aturdido <= 0) { e.fase = 'bajando'; e.t = 0; e.s.x = e.x; e.s.play('gusano-mueve'); }
      return;
    }
    e.t += dt;
    if (e.fase === 'oculto') {
      e.s.y = S + 18;
      if (e.t > 1.2 && Math.abs(j.x - e.x) < 360) { e.fase = 'saliendo'; e.t = 0; }
    } else if (e.fase === 'saliendo') {
      e.s.y = S + 18 - 18 * Math.min(1, e.t / 0.25);
      if (e.t >= 0.25) { e.fase = 'arriba'; e.t = 0; e.disparo = false; }
    } else if (e.fase === 'arriba') {
      e.s.y = S;
      if (!e.disparo && e.t > 0.45) {
        e.disparo = true;
        if (Math.abs(j.x - e.x) < 300) this.escupir(e);
      }
      if (e.t > 1.3) { e.fase = 'bajando'; e.t = 0; }
    } else {
      e.s.y = S + 18 * Math.min(1, e.t / 0.25);
      if (e.t >= 0.25) { e.fase = 'oculto'; e.t = 0; }
    }
    e.s.setFlipX(j.x < e.x);
  }

  escupir(e) {
    const dir = Math.sign(this.jugador.x - e.x) || 1;
    const img = this.add.image(e.x + dir * 6, this.ySuelo - 15, 'bolita').setDepth(18);
    this.bolitas.push({ img, vx: dir * VEL.bolita, vida: 2.5 });
    Sonido.escupir();
  }

  // Mosca zumbadora: patrulla en zigzag; si pasas debajo, baja en picada.
  actualizarMosca(e, dt) {
    const j = this.jugador;
    e.cd -= dt;
    if (e.fase === 'patrulla') {
      e.t += dt;
      const nx = e.x0 + Math.sin(e.t * 1.3) * e.rango;
      const ny = e.y0 + Math.sin(e.t * 6) * 6;
      e.s.setFlipX(nx < e.s.x);
      e.s.setPosition(nx, ny);
      const debajo = Math.abs(j.x - e.s.x) < 22 && j.y - 12 > e.s.y + 30 && j.y - e.s.y < 230;
      if (debajo && e.cd <= 0) {
        e.fase = 'picada';
        e.t2 = 0;
        e.objY = Math.min(j.y - 12, this.ySuelo - 8);
        Sonido.zumbido();
      }
    } else if (e.fase === 'picada') {
      e.t2 += dt;
      e.s.y += 230 * dt;
      e.s.x += Math.sign(j.x - e.s.x) * 50 * dt;
      if (e.s.y >= e.objY || e.t2 > 1.2) e.fase = 'regreso';
    } else {
      const tx = e.x0 + Math.sin(e.t * 1.3) * e.rango, ty = e.y0 + Math.sin(e.t * 6) * 6;
      const dx = tx - e.s.x, dy = ty - e.s.y, d = Math.hypot(dx, dy);
      if (d < 3) { e.fase = 'patrulla'; e.cd = 1.6; }
      else {
        const v = Math.min(d, 110 * dt);
        e.s.x += (dx / d) * v;
        e.s.y += (dy / d) * v;
        e.s.setFlipX(dx < 0);
      }
    }
  }

  golpeable(e) { return e.tipo === 'mosca' || e.s.y < this.ySuelo + 8; }
  peligroso(e) { return e.tipo === 'mosca' || (e.s.y < this.ySuelo + 8 && e.aturdido <= 0); }

  cajaEnemigo(e) {
    return e.tipo === 'gusano'
      ? { x: e.s.x - 5, y: e.s.y - 15, w: 10, h: 14 }
      : { x: e.s.x - 5, y: e.s.y - 4, w: 10, h: 8 };
  }

  cajaJugador() {
    const b = this.jugador.body;
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }

  solapa(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  esSolido(x, y) {
    const t = this.capa.getTileAtWorldXY(x, y);
    return !!t && Nivel1.SOLIDOS.includes(t.index);
  }

  golpearEnemigo(e, dmg) {
    e.hp -= dmg;
    if (e.hp <= 0) { this.derrotar(e); return; }
    if (e.tipo === 'gusano') {
      e.aturdido = 1.2;
      e.fase = 'arriba';
      e.s.y = this.ySuelo;
      Sonido.aturdir();
      this.popup(e.x, this.ySuelo - 28, '¡ATURDIDO!', '#9ad7ff');
    }
  }

  derrotar(e) {
    e.vivo = false;
    const base = e.tipo === 'gusano' ? 50 : 75;
    // Combo: si derrotas a otra plaga en menos de 2 s, el multiplicador sube (×1 → ×1.5 → ×2 → ×3).
    this.comboIdx = this.tiempo - this.ultimoDerribo < 2 ? Math.min(this.comboIdx + 1, COMBO.length - 1) : 0;
    this.ultimoDerribo = this.tiempo;
    const pts = Math.round(base * COMBO[this.comboIdx]);
    this.ptsEnemigos += pts;
    this.derrotados[e.tipo]++;
    const y = e.tipo === 'gusano' ? e.s.y - 8 : e.s.y;
    this.popup(e.s.x, y - 14, `+${pts}`, this.comboIdx ? '#ffa73e' : '#ffffff');
    const puff = this.add.image(e.s.x, y, 'puff').setDepth(40);
    this.tweens.add({ targets: puff, scale: 1.7, alpha: 0, duration: 320, onComplete: () => puff.destroy() });
    this.tweens.add({ targets: e.s, alpha: 0, y: e.s.y - 6, duration: 200, onComplete: () => e.s.setVisible(false) });
    Sonido.derrota();
  }

  actualizarProyectiles(dt) {
    for (let i = this.gotas.length - 1; i >= 0; i--) {
      const g = this.gotas[i];
      g.vida -= dt;
      g.img.x += g.vx * dt;
      let fuera = g.vida <= 0 || this.esSolido(g.img.x, g.img.y);
      if (!fuera) {
        const caja = { x: g.img.x - 3, y: g.img.y - 2, w: 6, h: 4 };
        for (const e of this.enemigos) {
          if (e.vivo && this.golpeable(e) && this.solapa(caja, this.cajaEnemigo(e))) {
            this.golpearEnemigo(e, 1);
            fuera = true;
            break;
          }
        }
      }
      if (fuera) { this.salpicar(g.img.x, g.img.y, 0x9ad7ff, 3); g.img.destroy(); this.gotas.splice(i, 1); }
    }
    const pj = this.cajaJugador();
    for (let i = this.bolitas.length - 1; i >= 0; i--) {
      const b = this.bolitas[i];
      b.vida -= dt;
      b.img.x += b.vx * dt;
      const toca = this.solapa(pj, { x: b.img.x - 3, y: b.img.y - 3, w: 6, h: 6 });
      if (toca) this.recibirDanio(b.img.x);
      if (toca || b.vida <= 0 || this.esSolido(b.img.x, b.img.y)) {
        this.salpicar(b.img.x, b.img.y, 0x8d9098, 3);
        b.img.destroy();
        this.bolitas.splice(i, 1);
      }
    }
  }

  // ---------- Objetos, puntos de control y peligros ----------

  revisarRecogidas() {
    const pj = this.cajaJugador();
    const toca = img => { const r = img.getBounds(); return this.solapa(pj, { x: r.x, y: r.y, w: r.width, h: r.height }); };
    for (const c of this.cajas) {
      if (c.tomada || !toca(c.img)) continue;
      c.tomada = true;
      this.enMano++;
      const pts = c.secreta ? 500 : 100;
      this.ptsCajas += pts;
      if (c.secreta) this.secreta = true; else this.cajasNormales++;
      this.popup(c.img.x, c.img.y - 18, c.secreta ? '¡CAJA SECRETA! +500' : '+100', c.secreta ? '#ffd23f' : '#ffffff');
      if (c.secreta) Sonido.secreta(); else Sonido.caja();
      this.tweens.killTweensOf(c.img);
      this.tweens.add({ targets: c.img, y: c.img.y - 16, alpha: 0, duration: 250, onComplete: () => c.img.setVisible(false) });
    }
    for (const it of this.items) {
      if (it.tomado || !toca(it.img)) continue;
      if (it.tipo === 'botiquin' && this.corazones >= 3) continue; // se queda para cuando lo necesites
      it.tomado = true;
      this.tweens.killTweensOf(it.img);
      it.img.setVisible(false);
      Sonido.item();
      if (it.tipo === 'tanque') {
        this.municion += 10;
        this.aviso('Rociador orgánico: 10 usos\nPresiona K para cambiar de arma');
      } else {
        this.corazones = Math.min(3, this.corazones + 1);
        this.popup(it.img.x, it.img.y - 18, '+1 CORAZÓN', '#ff4b5c');
      }
    }
  }

  revisarCheckpoints() {
    const j = this.jugador, cp = this.checkpoints[this.idxTarimin];
    const cerca = Math.abs(j.x - cp.x) < 20 && j.y > this.ySuelo - 40;
    if (cerca && !cp.activo) {
      cp.activo = true;
      this.respawn = { x: cp.x };
      this.tarimin.setFrame('f1');
      this.time.delayedCall(1200, () => this.tarimin.setFrame('f0'));
      Sonido.checkpoint();
      this.popup(this.tarimin.x, this.ySuelo - 44, '¡BIP-BIP!', '#7fe3ff');
      this.aviso('Punto de control:\nTarimín guarda tus cajas');
      this.entregar();
    } else if (cerca && this.enMano > 0) {
      this.entregar();
    }
    // Cuando dejas atrás a Tarimín, se adelanta al siguiente punto de control (fuera de la pantalla).
    if (cp.activo && this.idxTarimin + 1 < this.checkpoints.length && j.x > cp.x + 400) {
      this.idxTarimin++;
      const sig = this.checkpoints[this.idxTarimin];
      this.tarimin.x = sig.x + 10;
      this.txtCP.x = sig.x + 10;
    }
  }

  entregar() {
    if (this.enMano <= 0) return;
    const n = this.enMano;
    this.ptsEntregas += 25 * n;
    this.entregadas += n;
    this.enMano = 0;
    this.popup(this.jugador.x, this.jugador.y - 36, `ENTREGA +${25 * n}`, '#80ce57');
    Sonido.entrega();
  }

  revisarPeligros() {
    if (this.jugador.body.bottom > this.ySuelo + 18) this.perderVida('agua');
    else if (this.jugador.x >= this.camion.x - 6) this.llegarCamion();
  }

  recibirDanio(xFuente) {
    if (this.invul > 0 || this.estado !== 'jugando') return;
    this.corazones--;
    this.golpes++;
    this.comboIdx = 0;
    this.invul = 1.3;
    this.terminarDesliz();
    const dir = Math.sign(this.jugador.x - xFuente) || -this.mira;
    this.jugador.body.setVelocity(dir * 170, -200);
    this.empuje = 0.3;
    this.cameras.main.shake(120, 0.006);
    Sonido.danio();
    this.popup(this.jugador.x, this.jugador.y - 30, '-100', '#ff6b6b');
    if (this.corazones <= 0) this.perderVida('golpes');
  }

  perderVida(motivo) {
    if (this.estado !== 'jugando') return;
    this.vidasPerdidas++;
    this.vidas--;
    this.comboIdx = 0;
    if (motivo === 'agua') { Sonido.agua(); this.salpicar(this.jugador.x, this.ySuelo + 16, 0x9ad7ff, 10); }
    else Sonido.caida();
    this.popup(this.jugador.x, Math.min(this.jugador.y, this.ySuelo) - 30, '-500', '#ff6b6b');
    if (this.vidas <= 0) { this.gameOver(); return; }
    this.estado = 'reaparecer';
    this.terminarDesliz();
    this.cameras.main.fadeOut(350, 20, 12, 28);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.jugador.body.reset(this.respawn.x, this.ySuelo - 1);
      this.corazones = 3;
      this.invul = 1.6;
      this.empuje = 0;
      this.cameras.main.fadeIn(350);
      this.estado = 'jugando';
      this.aviso(this.vidas === 1 ? '¡Última vida!' : `Te quedan ${this.vidas} vidas`);
    });
  }

  gameOver() {
    this.estado = 'fin';
    this.physics.pause();
    Sonido.musicaParar();
    Sonido.perdiste();
    this.aviso('¡La Plaga Gris ganó esta vez!');
    this.time.delayedCall(1800, () => this.cameras.main.fadeOut(400));
    this.time.delayedCall(2300, () => this.scene.start('Resultado', this.resumen(true)));
  }

  llegarCamion() {
    if (this.estado !== 'jugando') return;
    this.estado = 'fin';
    this.entregar();
    this.jugador.body.setVelocity(0, 0);
    this.physics.pause();
    this.jugador.anims.play('luz-quieta', true);
    Sonido.musicaParar();
    Sonido.victoria();
    this.aviso('¡Cosecha a salvo!');
    this.tweens.add({ targets: this.jugador, alpha: 0, duration: 300, delay: 500 });
    this.tweens.add({ targets: this.camion, x: this.camion.x + 520, duration: 2200, delay: 900, ease: 'Quad.easeIn' });
    this.time.delayedCall(900, () => Sonido.motor());
    this.time.delayedCall(2600, () => this.cameras.main.fadeOut(500));
    this.time.delayedCall(3200, () => this.scene.start('Resultado', this.resumen(false)));
  }

  puntos() {
    return this.ptsCajas + this.ptsEntregas + this.ptsEnemigos - 100 * this.golpes - 500 * this.vidasPerdidas;
  }

  resumen(derrota) {
    const objetivo = Nivel1.TIEMPO_OBJETIVO;
    const bonoTiempo = derrota ? 0 : 10 * Math.max(0, objetivo - Math.floor(this.tiempo));
    const sinDanio = !derrota && this.golpes === 0 && this.vidasPerdidas === 0 ? 1000 : 0;
    return {
      derrota, objetivo, bonoTiempo, sinDanio,
      cajasNormales: this.cajasNormales, totalNormales: this.totalNormales, secreta: this.secreta,
      entregadas: this.entregadas, gusanos: this.derrotados.gusano, moscas: this.derrotados.mosca,
      ptsEnemigos: this.ptsEnemigos, tiempo: this.tiempo, golpes: this.golpes, vidasPerdidas: this.vidasPerdidas,
      total: this.puntos() + bonoTiempo + sinDanio,
    };
  }

  // ---------- Interfaz ----------

  actualizarHUD() {
    const poner = (t, s) => { if (t.text !== s) t.setText(s); };
    this.iconosCorazon.forEach((img, i) => img.setFrame(i < this.corazones ? 'f0' : 'f1'));
    poner(this.txtVidas, `VIDAS ${this.vidas}`);
    poner(this.txtPuntos, `PUNTOS ${this.puntos()}`);
    poner(this.txtArma, this.arma === 'manguera' ? 'MANGUERA' : `ROCIADOR ${this.municion}`);
    const combo = this.comboIdx > 0 && this.tiempo - this.ultimoDerribo < 2;
    poner(this.txtCombo, combo ? `COMBO ×${COMBO[this.comboIdx]}` : '');
    const tomadas = this.cajasNormales + (this.secreta ? 1 : 0);
    poner(this.txtCajas, `CAJAS ${tomadas}/${this.cajas.length}  EN MANO ${this.enMano}`);
    const s = Math.floor(this.tiempo);
    poner(this.txtTiempo, `TIEMPO ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
  }

  aviso(txt) {
    this.tweens.killTweensOf(this.txtAviso);
    this.txtAviso.setText(txt).setAlpha(1);
    this.tweens.add({ targets: this.txtAviso, alpha: 0, delay: 1800, duration: 500 });
  }

  popup(x, y, txt, color) {
    const t = this.add.text(x, y, txt, { fontFamily: FUENTE, fontSize: '8px', color, stroke: '#1b1020', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  salpicar(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const p = this.add.rectangle(x, y, 2, 2, color).setDepth(40);
      this.tweens.add({
        targets: p, x: x + Phaser.Math.Between(-12, 12), y: y + Phaser.Math.Between(-14, -2), alpha: 0,
        duration: 320, onComplete: () => p.destroy(),
      });
    }
  }
}
