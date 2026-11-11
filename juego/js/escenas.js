// Escenas de apoyo: arranque, título, pausa y resultados.

const leerRecord = () => { try { return Number(localStorage.getItem('cosechaHelada.record')) || 0; } catch (e) { return 0; } };
const guardarRecord = v => { try { localStorage.setItem('cosechaHelada.record', String(v)); } catch (e) { /* sin almacenamiento */ } };
const formatoTiempo = s => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;
const estiloTexto = (tam, color, borde = 3) => ({ fontFamily: FUENTE, fontSize: tam, color, stroke: '#2b1a10', strokeThickness: borde });

// Devuelve true si alguno de esos botones táctiles se tocó desde la última vez (y borra el pendiente).
const tomarToque = (...botones) => {
  const t = window.TACTIL;
  if (!t) return false;
  let tocado = false;
  botones.forEach(k => { if (t['_' + k]) { t['_' + k] = false; tocado = true; } });
  return tocado;
};
const BOTONES = ['izq', 'der', 'abajo', 'saltar', 'disparar', 'cambiar', 'pausa'];
const limpiarToques = () => tomarToque(...BOTONES);

// Genera el arte (texturas y animaciones) una sola vez y pasa al título.
class EscenaArranque extends Phaser.Scene {
  constructor() { super('Arranque'); }
  create() {
    Arte.crearTodo(this);
    this.scene.start('Titulo');
  }
}

class EscenaTitulo extends Phaser.Scene {
  constructor() { super('Titulo'); }

  create() {
    this.add.image(0, 0, 'cielo').setOrigin(0);
    this.add.image(500, 150, 'sol');
    this.add.tileSprite(0, 160, 640, 150, 'cerros').setOrigin(0);
    this.lomas = this.add.tileSprite(0, 214, 640, 110, 'lomas').setOrigin(0);
    this.add.tileSprite(0, 304, 640, 16, 'tiles', 't7').setOrigin(0);
    this.add.tileSprite(0, 320, 640, 40, 'tiles', 't1').setOrigin(0);
    this.add.image(90, 306, 'saguaro').setOrigin(0.5, 1).setScale(2);
    this.add.image(560, 306, 'arbusto').setOrigin(0.5, 1).setScale(2);
    this.add.sprite(270, 305, 'luz', 'f0').setOrigin(0.5, 1).setScale(2).play('luz-quieta');
    const tarimin = this.add.sprite(340, 305, 'tarimin', 'f1').setOrigin(0.5, 1).setScale(2);
    this.tweens.add({ targets: tarimin, y: 303, duration: 300, yoyo: true, repeat: -1 });
    const mosca = this.add.sprite(470, 230, 'mosca', 'f0').setScale(2).play('mosca-vuela').setFlipX(true);
    this.tweens.add({ targets: mosca, x: 420, y: 240, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(320, 56, 'COSECHA', estiloTexto('32px', '#ffd23f', 8)).setOrigin(0.5);
    this.add.text(320, 98, 'HELADA', estiloTexto('32px', '#9ad7ff', 8)).setOrigin(0.5);
    this.add.text(320, 132, 'La defensa del campo sonorense', estiloTexto('8px', '#fff8e1')).setOrigin(0.5);
    this.add.text(320, 148, 'Prototipo jugable · Nivel 1: El Campo', estiloTexto('8px', '#ffa73e')).setOrigin(0.5);
    const inicio = this.add.text(320, 190, 'ENTER o toca para empezar', estiloTexto('8px', '#ffffff')).setOrigin(0.5);
    this.tweens.add({ targets: inicio, alpha: 0.15, duration: 520, yoyo: true, repeat: -1 });

    this.add.text(8, 8, 'UTH · IDGS 8-2', estiloTexto('8px', '#fff8e1'));
    this.add.text(632, 8, `RÉCORD ${leerRecord()}`, estiloTexto('8px', '#ffd23f')).setOrigin(1, 0);
    this.add.text(320, 330, 'A D / flechas mover   W / ESPACIO saltar   S / ↓ deslizarse', estiloTexto('8px', '#ffffff')).setOrigin(0.5);
    this.add.text(320, 344, 'J manguera   K cambiar arma   ESC pausa   M sonido', estiloTexto('8px', '#ffffff')).setOrigin(0.5);

    this.listo = false;
    limpiarToques();
    this.input.keyboard.on('keydown-ENTER', this.empezar, this);
    this.input.keyboard.on('keydown-SPACE', this.empezar, this);
    this.input.on('pointerdown', this.empezar, this);
    this.cameras.main.fadeIn(300);
  }

  update(t) {
    this.lomas.tilePositionX = t * 0.01;
    if (tomarToque('saltar', 'disparar')) this.empezar();
  }

  empezar() {
    if (this.listo) return;
    this.listo = true;
    Sonido.iniciar();
    Sonido.musica();
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(320, () => this.scene.start('Juego'));
  }
}

class EscenaPausa extends Phaser.Scene {
  constructor() { super('Pausa'); }

  create() {
    this.add.rectangle(0, 0, 640, 360, 0x0b0612, 0.65).setOrigin(0);
    this.add.text(320, 150, 'PAUSA', estiloTexto('24px', '#ffd23f', 6)).setOrigin(0.5);
    this.add.text(320, 196, 'ESC / P / toque: seguir\n\nM: sonido', { ...estiloTexto('8px', '#ffffff'), align: 'center' }).setOrigin(0.5);
    this.cerrando = false;
    limpiarToques();
    this.time.delayedCall(150, () => {
      this.input.keyboard.on('keydown-ESC', this.seguir, this);
      this.input.keyboard.on('keydown-P', this.seguir, this);
      this.input.keyboard.on('keydown-ENTER', this.seguir, this);
      this.input.on('pointerdown', this.seguir, this);
    });
  }

  update() {
    if (tomarToque('pausa', 'saltar', 'disparar')) this.seguir();
  }

  seguir() {
    if (this.cerrando) return;
    this.cerrando = true;
    this.scene.resume('Juego');
    this.scene.stop();
  }
}

class EscenaResultado extends Phaser.Scene {
  constructor() { super('Resultado'); }

  create(d) {
    this.add.image(0, 0, 'cielo').setOrigin(0);
    this.add.rectangle(0, 0, 640, 360, 0x140c1c, 0.8).setOrigin(0);
    const est = (tam, color) => ({ fontFamily: FUENTE, fontSize: tam, color, stroke: '#140c1c', strokeThickness: 4 });

    this.add.text(320, 28, d.derrota ? 'LA PLAGA GANÓ ESTA VEZ' : '¡COSECHA A SALVO!', est('16px', d.derrota ? '#ff6b6b' : '#80ce57')).setOrigin(0.5);

    const filas = [
      ['Cajas rescatadas', `${d.cajasNormales}/${d.totalNormales} × 100`, d.cajasNormales * 100],
      ['Caja secreta', d.secreta ? 'sí' : 'no', d.secreta ? 500 : 0],
      ['Cajas entregadas', `${d.entregadas} × 25`, d.entregadas * 25],
      ['Plagas (con combo)', `gusanos ${d.gusanos} · moscas ${d.moscas}`, d.ptsEnemigos],
      ['Bono de tiempo', d.derrota ? '—' : `${formatoTiempo(d.tiempo)} (meta ${formatoTiempo(d.objetivo)})`, d.bonoTiempo],
      ['Sin daño', d.sinDanio ? 'sí' : 'no', d.sinDanio],
      ['Golpes recibidos', `${d.golpes} × -100`, -100 * d.golpes],
      ['Vidas perdidas', `${d.vidasPerdidas} × -500`, -500 * d.vidasPerdidas],
    ];
    let y = 56;
    filas.forEach(([concepto, detalle, pts]) => {
      this.add.text(70, y, concepto, est('8px', '#fff8e1'));
      this.add.text(290, y, detalle, est('8px', '#9ad7ff'));
      this.add.text(570, y, (pts > 0 ? '+' : '') + pts, est('8px', pts < 0 ? '#ff6b6b' : '#ffd23f')).setOrigin(1, 0);
      y += 17;
    });
    this.add.rectangle(70, y + 2, 500, 2, 0xffd23f).setOrigin(0);
    this.add.text(70, y + 12, 'TOTAL', est('16px', '#ffffff'));
    this.add.text(570, y + 12, String(d.total), est('16px', '#ffd23f')).setOrigin(1, 0);

    const record = leerRecord();
    const nuevo = d.total > record;
    if (nuevo) guardarRecord(d.total);
    const rango = d.derrota ? '-' : d.total >= 2500 ? 'S' : d.total >= 1800 ? 'A' : d.total >= 1200 ? 'B' : 'C';
    this.add.text(70, y + 40, `RANGO ${rango}`, est('16px', rango === 'S' ? '#ffd23f' : '#80ce57'));
    this.add.text(570, y + 44, nuevo ? '¡NUEVO RÉCORD!' : `RÉCORD ${record}`, est('8px', nuevo ? '#ffa73e' : '#fff8e1')).setOrigin(1, 0);

    const radio = d.derrota
      ? 'ING. MARISOL (radio): "No te rindas, Luz. La cosecha todavía se puede salvar."'
      : 'ING. MARISOL (radio): "Buen trabajo, Luz. Pero la plaga entró a la recepción. Ponte la bata: sin inocuidad no se entra."';
    this.add.text(70, y + 70, radio, { ...est('8px', '#7fe3ff'), wordWrap: { width: 500 }, lineSpacing: 5 });
    this.add.text(320, 326, d.derrota ? 'Fin de la partida' : 'Fin del prototipo · Próximo: Nivel 2 · Recepción', est('8px', '#ffa73e')).setOrigin(0.5);
    const otra = this.add.text(320, 343, 'ENTER o toca: jugar otra vez   ·   T: título', est('8px', '#ffffff')).setOrigin(0.5);
    this.tweens.add({ targets: otra, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.listo = false;
    this.aceptaToque = false;
    this.time.delayedCall(700, () => {
      limpiarToques();
      this.input.keyboard.on('keydown-ENTER', this.otraVez, this);
      this.input.keyboard.on('keydown-SPACE', this.otraVez, this);
      this.input.keyboard.on('keydown-T', this.alTitulo, this);
      this.input.on('pointerdown', this.otraVez, this);
      this.aceptaToque = true;
    });
    this.cameras.main.fadeIn(400);
  }

  update() {
    if (this.aceptaToque && tomarToque('saltar', 'disparar')) this.otraVez();
  }

  otraVez() {
    if (this.listo) return;
    this.listo = true;
    Sonido.iniciar();
    Sonido.musica();
    this.scene.start('Juego');
  }

  alTitulo() {
    if (this.listo) return;
    this.listo = true;
    this.scene.start('Titulo');
  }
}
