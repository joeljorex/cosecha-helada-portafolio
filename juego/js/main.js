// Arranque del juego: configuración de Phaser y controles táctiles.

// Estado de los botones táctiles; las escenas lo leen en cada cuadro.
window.TACTIL = { izq: false, der: false, abajo: false, saltar: false, disparar: false, cambiar: false, pausa: false };

(function controlesTactiles() {
  document.querySelectorAll('#tactil [data-k]').forEach(btn => {
    const k = btn.dataset.k;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      Sonido.iniciar();
      window.TACTIL[k] = true;        // botón sostenido
      window.TACTIL['_' + k] = true;  // toque pendiente: lo consume la escena con tomarToque()
      btn.classList.add('activo');
    });
    const soltar = e => {
      e.preventDefault();
      window.TACTIL[k] = false;
      btn.classList.remove('activo');
    };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => btn.addEventListener(ev, soltar));
  });

  const botonSonido = document.getElementById('btn-sonido');
  const pintar = () => { botonSonido.textContent = Sonido.estaMudo() ? '🔇' : '🔊'; };
  botonSonido.addEventListener('click', () => { Sonido.iniciar(); Sonido.alternarMudo(); pintar(); });
  window.addEventListener('keydown', e => {
    if (e.key === 'm' || e.key === 'M') { Sonido.alternarMudo(); pintar(); }
  });
  pintar();
})();

function arrancar() {
  if (typeof Phaser === 'undefined') {
    document.getElementById('juego').innerHTML = '<p class="error">No se pudo cargar Phaser. Revisa tu conexión a Internet y recarga la página.</p>';
    return;
  }
  window.juego = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'juego',
    width: 640,
    height: 360,
    backgroundColor: '#140c1c',
    pixelArt: true,
    roundPixels: true,
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 900 }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [EscenaArranque, EscenaTitulo, EscenaJuego, EscenaPausa, EscenaResultado],
  });
}

// Se espera a la fuente pixel para que los textos no salgan con otra letra (máximo 3 s).
const fuenteLista = document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve();
Promise.race([fuenteLista, new Promise(r => setTimeout(r, 3000))]).then(arrancar, arrancar);
