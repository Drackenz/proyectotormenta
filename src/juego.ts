const CONFIG = {
  filas: 5, // filas
  columnas: 5, // columnas
  familiasMinimasPorZona: 1, // familias por zona
  familiasMaximasPorZona: 3, // familias por zona
  aguaInicialMinima: 0, // niveles de agua
  aguaInicialMaxima: 3, // niveles de agua
  aguaParaInundar: 6, // niveles de agua
  aumentoLluviaZonaNormal: 1, // niveles de agua por turno
  aumentoLluviaQuebrada: 2, // niveles de agua por turno
  reduccionDrenajeZona: 3, // niveles de agua
  reduccionDrenajeVecinas: 1, // niveles de agua por zona vecina
  accionesPorTurno: 3, // acciones
  cantidadTurnos: 8, // turnos
  turnoInicial: 1, // turnos
  escalaPorcentual: 100, // puntos porcentuales
  porcentajeMeta: 70, // porcentaje de familias
} as const;

export type Zona = {
  fila: number;
  columna: number;
  familias: number;
  agua: number;
  inundada: boolean;
  evacuada: boolean;
};

export type Estado = {
  zonas: Zona[];
  turno: number;
  accionesRestantes: number;
  resultado: "en curso" | "ganada" | "perdida";
};

export function crearGeneradorAzar(semilla: number): () => number {
  if (!Number.isFinite(semilla)) {
    throw new RangeError("La semilla debe ser un número finito.");
  }

  let estadoAzar = semilla >>> 0;

  return () => {
    estadoAzar = (estadoAzar + 0x6d2b79f5) >>> 0;
    let valor = estadoAzar;
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
  };
}

export function crearEstado(semilla: number): Estado {
  const azar = crearGeneradorAzar(semilla);
  const zonas: Zona[] = [];

  for (let fila = 0; fila < CONFIG.filas; fila += 1) {
    for (let columna = 0; columna < CONFIG.columnas; columna += 1) {
      zonas.push({
        fila,
        columna,
        familias:
          Math.floor(
            azar() *
              (CONFIG.familiasMaximasPorZona -
                CONFIG.familiasMinimasPorZona +
                1),
          ) + CONFIG.familiasMinimasPorZona,
        agua:
          Math.floor(
            azar() *
              (CONFIG.aguaInicialMaxima - CONFIG.aguaInicialMinima + 1),
          ) + CONFIG.aguaInicialMinima,
        inundada: false,
        evacuada: false,
      });
    }
  }

  return {
    zonas,
    turno: CONFIG.turnoInicial,
    accionesRestantes: CONFIG.accionesPorTurno,
    resultado: "en curso",
  };
}

export function obtenerResumen(estado: Estado): {
  turno: number;
  accionesRestantes: number;
  familiasSalvas: number;
  familiasEnRiesgo: number;
  familiasPerdidas: number;
  familiasTotales: number;
  porcentajeSalvado: number;
  metaPorcentaje: number;
} {
  let familiasSalvas = 0;
  let familiasEnRiesgo = 0;
  let familiasPerdidas = 0;
  let familiasTotales = 0;

  for (const zona of estado.zonas) {
    familiasTotales += zona.familias;

    if (zona.evacuada) {
      familiasSalvas += zona.familias;
    } else if (zona.inundada) {
      familiasPerdidas += zona.familias;
    } else {
      familiasEnRiesgo += zona.familias;
    }
  }

  return {
    turno: estado.turno,
    accionesRestantes: estado.accionesRestantes,
    familiasSalvas,
    familiasEnRiesgo,
    familiasPerdidas,
    familiasTotales,
    porcentajeSalvado:
      familiasTotales === 0
        ? 0
        : (familiasSalvas / familiasTotales) * CONFIG.escalaPorcentual,
    metaPorcentaje: CONFIG.porcentajeMeta,
  };
}

function buscarZona(
  estado: Estado,
  fila: number,
  columna: number,
): Zona | undefined {
  return estado.zonas.find(
    (zona) => zona.fila === fila && zona.columna === columna,
  );
}

function consumirAccion(estado: Estado): void {
  estado.accionesRestantes -= 1;

  if (estado.accionesRestantes === 0) {
    avanzarTurno(estado);
  }
}

function avanzarTurno(estado: Estado): void {
  for (const zona of estado.zonas) {
    if (!zona.inundada) {
      zona.agua +=
        zona.fila === CONFIG.filas - 1
          ? CONFIG.aumentoLluviaQuebrada
          : CONFIG.aumentoLluviaZonaNormal;

      if (zona.agua >= CONFIG.aguaParaInundar) {
        zona.inundada = true;
      }
    }
  }

  const resumen = obtenerResumen(estado);
  const familiasAunSalvables =
    resumen.familiasSalvas + resumen.familiasEnRiesgo;

  if (
    familiasAunSalvables * CONFIG.escalaPorcentual <
    resumen.familiasTotales * CONFIG.porcentajeMeta
  ) {
    estado.resultado = "perdida";
    return;
  }

  if (estado.turno === CONFIG.cantidadTurnos) {
    estado.resultado =
      resumen.familiasSalvas * CONFIG.escalaPorcentual >=
      resumen.familiasTotales * CONFIG.porcentajeMeta
        ? "ganada"
        : "perdida";
    return;
  }

  estado.turno += 1;
  estado.accionesRestantes = CONFIG.accionesPorTurno;
}

export function avisar(
  estado: Estado,
  fila: number,
  columna: number,
): boolean {
  if (
    estado.resultado !== "en curso" ||
    estado.accionesRestantes <= 0 ||
    !Number.isInteger(fila) ||
    !Number.isInteger(columna)
  ) {
    return false;
  }

  const zona = buscarZona(estado, fila, columna);
  if (zona === undefined || zona.inundada || zona.evacuada) {
    return false;
  }

  zona.evacuada = true;
  consumirAccion(estado);
  return true;
}

export function drenar(
  estado: Estado,
  fila: number,
  columna: number,
): boolean {
  if (
    estado.resultado !== "en curso" ||
    estado.accionesRestantes <= 0 ||
    !Number.isInteger(fila) ||
    !Number.isInteger(columna)
  ) {
    return false;
  }

  const zona = buscarZona(estado, fila, columna);
  if (zona === undefined) {
    return false;
  }

  for (const afectada of estado.zonas) {
    const distancia =
      Math.abs(afectada.fila - fila) + Math.abs(afectada.columna - columna);
    const reduccion =
      distancia === 0
        ? CONFIG.reduccionDrenajeZona
        : distancia === 1
          ? CONFIG.reduccionDrenajeVecinas
          : 0;

    afectada.agua = Math.max(0, afectada.agua - reduccion);
  }

  consumirAccion(estado);
  return true;
}
