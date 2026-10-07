import { describe, expect, it } from "vitest";
import {
  avisar,
  crearEstado,
  drenar,
  obtenerResumen,
  type Estado,
} from "../src/juego";

function familiasTotales(estado: Estado): number {
  return estado.zonas.reduce((total, zona) => total + zona.familias, 0);
}

function rescatarConEstrategia(estado: Estado): void {
  while (estado.resultado === "en curso") {
    const rescatables = estado.zonas.filter(
      (zona) => !zona.inundada && !zona.evacuada,
    );
    const objetivo = rescatables.sort((a, b) => {
      const aUrgente =
        a.agua + (a.fila === 4 ? 2 : 1) >= 6 ? 1 : 0;
      const bUrgente =
        b.agua + (b.fila === 4 ? 2 : 1) >= 6 ? 1 : 0;
      return (
        bUrgente - aUrgente ||
        b.familias - a.familias ||
        b.agua - a.agua
      );
    })[0];

    if (objetivo === undefined) {
      expect(drenar(estado, 2, 2)).toBe(true);
      continue;
    }

    expect(avisar(estado, objetivo.fila, objetivo.columna)).toBe(true);
  }
}

describe("crearEstado", () => {
  it("arma un tablero con 25 zonas organizadas en cinco filas y cinco columnas", () => {
    const estado = crearEstado(1);

    expect(estado.zonas).toHaveLength(25);
    expect(new Set(estado.zonas.map((zona) => `${zona.fila},${zona.columna}`)).size)
      .toBe(25);
    expect(Math.max(...estado.zonas.map((zona) => zona.fila))).toBe(4);
    expect(Math.max(...estado.zonas.map((zona) => zona.columna))).toBe(4);
    expect(estado.zonas.every((zona) => zona.familias >= 1 && zona.familias <= 3))
      .toBe(true);
  });

  it("genera el mismo tablero con la misma semilla y otro con una semilla distinta", () => {
    expect(crearEstado(123).zonas).toEqual(crearEstado(123).zonas);
    expect(crearEstado(123).zonas).not.toEqual(crearEstado(456).zonas);
  });
});

describe("acciones del jugador", () => {
  it("avisa una zona válida, la evacúa y consume una acción", () => {
    const estado = crearEstado(2);
    const zona = estado.zonas[0];

    expect(avisar(estado, zona.fila, zona.columna)).toBe(true);
    expect(zona.evacuada).toBe(true);
    expect(estado.accionesRestantes).toBe(2);
  });

  it("rechaza avisar una zona inexistente, inundada, evacuada o con coordenadas inválidas", () => {
    const estado = crearEstado(3);
    const evacuada = estado.zonas[0];
    const inundada = estado.zonas[1];
    evacuada.evacuada = true;
    inundada.inundada = true;

    expect(avisar(estado, 20, 20)).toBe(false);
    expect(avisar(estado, 0.5, 0)).toBe(false);
    expect(avisar(estado, evacuada.fila, evacuada.columna)).toBe(false);
    expect(avisar(estado, inundada.fila, inundada.columna)).toBe(false);
    expect(estado.accionesRestantes).toBe(3);
  });

  it("drena la zona y sus vecinas, limita el agua a cero y consume una acción", () => {
    const estado = crearEstado(4);
    const centro = estado.zonas.find((zona) => zona.fila === 2 && zona.columna === 2)!;
    const vecina = estado.zonas.find((zona) => zona.fila === 2 && zona.columna === 3)!;
    const lejana = estado.zonas.find((zona) => zona.fila === 0 && zona.columna === 0)!;
    centro.agua = 2;
    vecina.agua = 2;
    lejana.agua = 3;

    expect(drenar(estado, 2, 2)).toBe(true);
    expect(centro.agua).toBe(0);
    expect(vecina.agua).toBe(1);
    expect(lejana.agua).toBe(3);
    expect(estado.accionesRestantes).toBe(2);
  });

  it("rechaza drenar con coordenadas inexistentes o inválidas", () => {
    const estado = crearEstado(5);

    expect(drenar(estado, -1, 0)).toBe(false);
    expect(drenar(estado, 0, 1.5)).toBe(false);
    expect(estado.accionesRestantes).toBe(3);
  });

  it("no permite actuar cuando no quedan acciones disponibles", () => {
    const estado = crearEstado(6);
    const antes = structuredClone(estado);
    estado.accionesRestantes = 0;
    const despuesDePreparar = structuredClone(estado);

    expect(avisar(estado, 0, 0)).toBe(false);
    expect(drenar(estado, 0, 0)).toBe(false);
    expect(estado).toEqual(despuesDePreparar);
    expect(antes.accionesRestantes).toBe(3);
  });

  it("no permite actuar después de que la partida terminó", () => {
    const estado = crearEstado(7);
    estado.resultado = "ganada";

    expect(avisar(estado, 0, 0)).toBe(false);
    expect(drenar(estado, 0, 0)).toBe(false);
  });
});

describe("avance de la partida", () => {
  it("avanza el turno y aumenta el agua al consumir la tercera acción", () => {
    const estado = crearEstado(8);
    const nivelesIniciales = estado.zonas.map((zona) => zona.agua);

    for (let columna = 0; columna < 3; columna += 1) {
      expect(avisar(estado, 0, columna)).toBe(true);
    }

    expect(estado.turno).toBe(2);
    expect(estado.accionesRestantes).toBe(3);
    for (const zona of estado.zonas) {
      const indice = estado.zonas.indexOf(zona);
      expect(zona.agua).toBe(
        nivelesIniciales[indice] + (zona.fila === 4 ? 2 : 1),
      );
    }
  });

  it("inunda las zonas que alcanzan el nivel de agua límite al terminar el turno", () => {
    const estado = crearEstado(9);
    const normal = estado.zonas.find((zona) => zona.fila === 0 && zona.columna === 0)!;
    const quebrada = estado.zonas.find((zona) => zona.fila === 4 && zona.columna === 0)!;
    normal.agua = 5;
    quebrada.agua = 4;

    for (let columna = 0; columna < 3; columna += 1) {
      avisar(estado, 1, columna);
    }

    expect(normal.inundada).toBe(true);
    expect(quebrada.inundada).toBe(true);
  });

  it("declara la victoria al finalizar el último turno con al menos el 70 por ciento de las familias a salvo", () => {
    const estado = crearEstado(10);
    estado.zonas.forEach((zona, indice) => {
      zona.familias = 1;
      zona.evacuada = indice < 18;
      zona.agua = 0;
    });
    estado.turno = 8;
    estado.accionesRestantes = 1;

    expect(drenar(estado, 0, 0)).toBe(true);
    expect(estado.resultado).toBe("ganada");
    expect(obtenerResumen(estado).porcentajeSalvado).toBeGreaterThanOrEqual(70);
  });

  it("declara la derrota cuando las familias que siguen a salvo ya no alcanzan la meta", () => {
    const estado = crearEstado(11);
    estado.zonas.forEach((zona, indice) => {
      zona.familias = 1;
      zona.inundada = indice < 8;
      zona.agua = 0;
    });
    estado.accionesRestantes = 1;

    expect(drenar(estado, 0, 0)).toBe(true);
    expect(estado.resultado).toBe("perdida");
  });

  it("mantiene constante el total de familias durante toda la partida", () => {
    const estado = crearEstado(12);
    const totalInicial = familiasTotales(estado);

    rescatarConEstrategia(estado);

    expect(familiasTotales(estado)).toBe(totalInicial);
    expect(obtenerResumen(estado).familiasTotales).toBe(totalInicial);
  });

  it("permite ganar una partida completa al rescatar primero las zonas urgentes y con más familias", () => {
    const estado = crearEstado(42);
    const totalInicial = familiasTotales(estado);

    rescatarConEstrategia(estado);

    expect(estado.resultado).toBe("ganada");
    expect(obtenerResumen(estado).porcentajeSalvado).toBeGreaterThanOrEqual(70);
    expect(familiasTotales(estado)).toBe(totalInicial);
  });

  it("termina en derrota si no se rescata ninguna familia", () => {
    const estado = crearEstado(42);

    while (estado.resultado === "en curso") {
      for (let accion = 0; accion < 3 && estado.resultado === "en curso"; accion += 1) {
        expect(drenar(estado, 2, 2)).toBe(true);
      }
    }

    expect(estado.resultado).toBe("perdida");
    expect(obtenerResumen(estado).familiasSalvas).toBe(0);
  });
});
