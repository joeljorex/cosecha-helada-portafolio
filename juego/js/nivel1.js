// Nivel 1 · El Campo.
// El mapa se arma con código siguiendo el boceto del GDD (img/mapa_nivel1.svg).
// Cada celda mide 16×16 px; c = columna (x) y f = fila (y, la fila 0 es la de arriba).
// En el Sprint 2 este mapa se pasa a Tiled y se carga como JSON.
const Nivel1 = (() => {
  const T = 16, ANCHO = 272, ALTO = 23, SUELO = 19, TIEMPO_OBJETIVO = 180;
  const VACIO = -1, PASTO = 0, TIERRA = 1, CONCRETO = 2, TARIMA = 3, AGUA_SUP = 4, AGUA = 5, PACA = 6, SURCO = 7;
  const SOLIDOS = [PASTO, TIERRA, CONCRETO, PACA, SURCO]; // la tarima solo se pisa desde arriba

  function crear() {
    const g = Array.from({ length: ALTO }, () => new Array(ANCHO).fill(VACIO));
    const rect = (c0, f0, c1, f1, t) => {
      for (let f = f0; f <= f1; f++) for (let c = c0; c <= c1; c++) g[f][c] = t;
    };

    // Suelo
    rect(0, SUELO, ANCHO - 1, SUELO, PASTO);
    rect(0, SUELO + 1, ANCHO - 1, ALTO - 1, TIERRA);
    rect(50, SUELO, 100, SUELO, SURCO);
    rect(170, SUELO, 240, SUELO, SURCO);

    // Zona 3: canal de riego (caer al agua = −1 vida)
    rect(112, SUELO, 131, ALTO - 1, VACIO);
    rect(112, SUELO + 1, 131, SUELO + 1, AGUA_SUP);
    rect(112, SUELO + 2, 131, ALTO - 1, AGUA);
    rect(111, SUELO, 111, ALTO - 1, CONCRETO);
    rect(132, SUELO, 132, ALTO - 1, CONCRETO);

    // Pacas de paja (obstáculos para saltar)
    [[17, 17, 18, 18], [24, 16, 25, 18], [80, 17, 81, 18], [224, 17, 225, 18]]
      .forEach(([c0, f0, c1, f1]) => rect(c0, f0, c1, f1, PACA));

    // Tarimas fijas: [columna inicial, fila, columna final]
    [[35, 15, 38], [63, 15, 67],                              // zonas 1 y 2
      [115, 18, 117], [127, 17, 128],                         // zona 3 (canal)
      [138, 16, 141], [146, 13, 149], [154, 10, 157], [162, 7, 165], // zona 4 (escalera)
      [208, 15, 211]]                                         // zona 5
      .forEach(([c0, f, c1]) => rect(c0, f, c1, f, TARIMA));

    return {
      grid: g,
      jugador: { c: 3 },
      letreros: [
        { c: 5, texto: 'A D o flechas\npara caminar' },
        { c: 12, texto: 'W / ESPACIO\nsaltar' },
        { c: 21, texto: 'Mantén saltar\npara subir más' },
        { c: 29, texto: 'Recoge cajas\nde cosecha' },
        { c: 40, texto: 'S / ↓ corriendo\npara deslizarte' },
        { c: 49, texto: 'J: manguera\naturde gusanos' },
        { c: 91, texto: 'K: cambia al\nrociador' },
        { c: 108, texto: '¡Cuidado!\nel canal moja' },
        { c: 135, texto: 'Sube por\nlas tarimas' },
        { c: 204, texto: '¡Corre al\ncamión!' },
      ],
      // f = fila que ocupa el objeto (queda apoyado sobre la fila f + 1)
      cajas: [{ c: 31, f: 18 }, { c: 65, f: 14 }, { c: 140, f: 15 }, { c: 148, f: 12 }, { c: 218, f: 18 }],
      secreta: { c: 164, f: 6 },
      gusanos: [56, 74, 176, 236],
      moscas: [{ c: 144, f: 8, rango: 48 }, { c: 157, f: 4, rango: 40 }],
      tanque: { c: 88, f: 18 },
      botiquin: { c: 209, f: 14 },
      checkpoints: [100, 198],
      tarimaMovil: { c: 121, fArriba: 14, fAbajo: 18 },
      camion: { c: 250 },
    };
  }

  return { T, ANCHO, ALTO, SUELO, TIEMPO_OBJETIVO, VACIO, PASTO, TIERRA, CONCRETO, TARIMA, AGUA_SUP, AGUA, PACA, SURCO, SOLIDOS, crear };
})();
