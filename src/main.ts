import './estilo.css'
import { avisar, crearEstado, drenar, obtenerResumen, type Estado, type Zona } from './juego'

function obtenerApp(): HTMLDivElement {
  const contenedor = document.querySelector<HTMLDivElement>('#app')
  if (contenedor === null) {
    throw new Error('No se encontró el contenedor #app.')
  }
  return contenedor
}

const app = obtenerApp()

let estado: Estado | null = null
let zonaSeleccionada: { fila: number; columna: number } | null = null
let mensaje = ''

function enfocar(selector: string): void {
  requestAnimationFrame(() => {
    app.querySelector<HTMLElement>(selector)?.focus()
  })
}

function describirZona(zona: Zona): string {
  if (zona.evacuada) return 'Familias evacuadas'
  if (zona.inundada) return 'Inundada'
  return 'En riesgo'
}

function simboloZona(zona: Zona): string {
  if (zona.evacuada) return '✓'
  if (zona.inundada) return '!'
  return '○'
}

function claseZona(zona: Zona): string {
  if (zona.evacuada) return 'zona zona--evacuada'
  if (zona.inundada) return 'zona zona--inundada'
  return 'zona'
}

function renderInicio(): void {
  app.innerHTML = `
    <main class="pantalla pantalla--inicio">
      <section class="panel bienvenida" aria-labelledby="titulo">
        <p class="sobrelinea">Misión de rescate</p>
        <h1 id="titulo">Aguas en alerta</h1>
        <p class="introduccion">
          Protege a las familias antes de que suba el agua. Evacúa zonas y drena
          el terreno para alcanzar la meta de rescate.
        </p>
        <ul class="instrucciones">
          <li>Elige una zona del tablero para seleccionarla.</li>
          <li>Usa una acción para avisar a sus familias o drenar esa zona y sus vecinas.</li>
          <li>Al terminar tus acciones, el agua sube. Salva al menos el 70 % de las familias.</li>
        </ul>
        <button class="boton boton--principal boton--grande" id="comenzar" type="button" aria-label="Comenzar una partida nueva. Disponible.">
          Comenzar partida
        </button>
      </section>
    </main>
  `

  app.querySelector<HTMLButtonElement>('#comenzar')?.addEventListener('click', () => {
    estado = crearEstado(Date.now())
    zonaSeleccionada = null
    mensaje = 'Selecciona una zona del tablero.'
    render()
    enfocar('#titulo-juego')
  })
}

function renderTablero(actual: Estado): string {
  const columnas = Math.max(...actual.zonas.map((zona) => zona.columna)) + 1
  const casillas = actual.zonas.map((zona) => {
    const seleccionada =
      zonaSeleccionada?.fila === zona.fila &&
      zonaSeleccionada.columna === zona.columna
    const estadoZona = describirZona(zona)
    const etiqueta = `Zona, fila ${zona.fila + 1}, columna ${zona.columna + 1}. ${zona.familias} familias. Agua: ${zona.agua}. Estado: ${estadoZona}. ${seleccionada ? 'Seleccionada.' : 'No seleccionada.'}`

    return `
      <button
        class="${claseZona(zona)}${seleccionada ? ' zona--seleccionada' : ''}"
        type="button"
        data-fila="${zona.fila}"
        data-columna="${zona.columna}"
        aria-label="${etiqueta}"
        aria-pressed="${seleccionada}"
      >
        <span class="zona__simbolo" aria-hidden="true">${simboloZona(zona)}</span>
        <span class="zona__coordenada">${zona.fila + 1}-${zona.columna + 1}</span>
        <span class="zona__familias">${zona.familias} fam.</span>
        <span class="zona__agua">Agua ${zona.agua}</span>
        <span class="zona__estado">${estadoZona}</span>
      </button>
    `
  }).join('')

  return `<div class="tablero" style="--columnas: ${columnas}" role="group" aria-label="Tablero de zonas, selecciona una de las ${actual.zonas.length} zonas">${casillas}</div>`
}

function renderPartida(actual: Estado): void {
  const resumen = obtenerResumen(actual)
  const contenidoTablero = renderTablero(actual)

  app.innerHTML = `
    <main class="pantalla pantalla--juego">
      <header class="encabezado">
        <div>
          <p class="sobrelinea">Misión de rescate</p>
          <h1 id="titulo-juego" tabindex="-1">Aguas en alerta</h1>
        </div>
        <button class="boton boton--secundario" id="nueva-partida" type="button" aria-label="Volver al inicio para comenzar una partida nueva. Disponible.">
          Nueva partida
        </button>
      </header>

      <section class="resumen" aria-label="Estado de la partida" aria-live="polite" aria-atomic="true">
        <div class="dato"><span>Turno</span><strong>${resumen.turno}</strong></div>
        <div class="dato"><span>Acciones</span><strong>${resumen.accionesRestantes}</strong></div>
        <div class="dato"><span>Familias a salvo</span><strong>${resumen.familiasSalvas} / ${resumen.familiasTotales}</strong></div>
        <div class="dato"><span>Meta de rescate</span><strong>${resumen.metaPorcentaje}%</strong></div>
      </section>

      <section class="zona-juego" aria-label="Partida en curso">
        <div class="tablero-contenido">
          <div class="titulo-seccion">
            <div>
              <h2>Tablero de zonas</h2>
              <p>Selecciona una zona para elegir una acción.</p>
            </div>
          </div>
          ${contenidoTablero}
          <ul class="leyenda" aria-label="Leyenda del tablero">
            <li><span class="muestra muestra--normal" aria-hidden="true">○</span>En riesgo</li>
            <li><span class="muestra muestra--evacuada" aria-hidden="true">✓</span>Evacuada</li>
            <li><span class="muestra muestra--inundada" aria-hidden="true">!</span>Inundada</li>
          </ul>
        </div>

        <aside class="panel acciones" aria-labelledby="titulo-acciones">
          <h2 id="titulo-acciones">Acciones</h2>
          <p class="seleccion" aria-live="polite" aria-atomic="true">
            ${zonaSeleccionada
              ? `Zona ${zonaSeleccionada.fila + 1}-${zonaSeleccionada.columna + 1} seleccionada`
              : 'Ninguna zona seleccionada'}
          </p>
          <button class="boton boton--principal" id="avisar" type="button" aria-label="${zonaSeleccionada ? 'Avisar a las familias y evacuar la zona seleccionada. Disponible.' : 'Avisar y evacuar. Deshabilitado: primero selecciona una zona.'}" ${zonaSeleccionada ? '' : 'disabled'}>
            Avisar y evacuar
          </button>
          <p class="ayuda-accion">Salva a las familias de la zona seleccionada.</p>
          <button class="boton boton--drenar" id="drenar" type="button" aria-label="${zonaSeleccionada ? 'Drenar la zona seleccionada y sus vecinas. Disponible.' : 'Drenar zona. Deshabilitado: primero selecciona una zona.'}" ${zonaSeleccionada ? '' : 'disabled'}>
            Drenar zona
          </button>
          <p class="ayuda-accion">Reduce el agua en la zona y en sus vecinas.</p>
          <p class="mensaje" id="mensaje-partida" role="status" aria-live="polite" tabindex="-1">${mensaje}</p>
        </aside>
      </section>
    </main>
  `

  app.querySelectorAll<HTMLButtonElement>('.zona').forEach((boton) => {
    boton.addEventListener('click', () => {
      zonaSeleccionada = {
        fila: Number(boton.dataset.fila),
        columna: Number(boton.dataset.columna),
      }
      const zona = actual.zonas.find(
        (elemento) =>
          elemento.fila === zonaSeleccionada?.fila &&
          elemento.columna === zonaSeleccionada?.columna,
      )
      mensaje = zona
        ? `Zona ${zona.fila + 1}-${zona.columna + 1} seleccionada. ${zona.familias} familias. Agua: ${zona.agua}. Estado: ${describirZona(zona)}.`
        : 'Zona seleccionada.'
      render()
      enfocar(
        `.zona[data-fila="${zonaSeleccionada.fila}"][data-columna="${zonaSeleccionada.columna}"]`,
      )
    })
  })

  app.querySelector<HTMLButtonElement>('#avisar')?.addEventListener('click', () => {
    if (zonaSeleccionada === null) return
    const resultado = avisar(actual, zonaSeleccionada.fila, zonaSeleccionada.columna)
    mensaje = resultado ? 'Familias evacuadas.' : 'No se pudo avisar a esa zona.'
    if (resultado) zonaSeleccionada = null
    render()
    enfocar(resultado ? '#mensaje-partida' : '#titulo-juego')
  })

  app.querySelector<HTMLButtonElement>('#drenar')?.addEventListener('click', () => {
    if (zonaSeleccionada === null) return
    const resultado = drenar(actual, zonaSeleccionada.fila, zonaSeleccionada.columna)
    mensaje = resultado ? 'Se drenó la zona y sus vecinas.' : 'No se pudo drenar esa zona.'
    if (resultado) zonaSeleccionada = null
    render()
    enfocar(resultado ? '#mensaje-partida' : '#titulo-juego')
  })

  app.querySelector<HTMLButtonElement>('#nueva-partida')?.addEventListener('click', () => {
    estado = null
    zonaSeleccionada = null
    mensaje = ''
    render()
    enfocar('#comenzar')
  })
}

function renderFinal(actual: Estado): void {
  const resumen = obtenerResumen(actual)
  const ganada = actual.resultado === 'ganada'

  app.innerHTML = `
    <main class="pantalla pantalla--final">
      <section class="panel resultado ${ganada ? 'resultado--ganada' : 'resultado--perdida'}">
        <p class="sobrelinea">Misión finalizada</p>
        <h1 id="titulo-final" tabindex="-1">${ganada ? '¡Rescate exitoso!' : 'Rescate incompleto'}</h1>
        <p class="introduccion">
          ${ganada
            ? 'Las familias alcanzaron la meta de rescate.'
            : 'No se alcanzó la meta de familias a salvo.'}
        </p>
        <div class="resultado__cifras">
          <p><strong>${resumen.familiasSalvas}</strong><span>familias a salvo</span></p>
          <p><strong>${resumen.porcentajeSalvado.toFixed(0)}%</strong><span>de la población</span></p>
          <p><strong>${resumen.familiasPerdidas}</strong><span>familias perdidas</span></p>
        </div>
        <button class="boton boton--principal boton--grande" id="otra-partida" type="button" aria-label="Empezar otra partida. Disponible.">
          Jugar otra vez
        </button>
      </section>
    </main>
  `

  app.querySelector<HTMLButtonElement>('#otra-partida')?.addEventListener('click', () => {
    estado = crearEstado(Date.now())
    zonaSeleccionada = null
    mensaje = 'Selecciona una zona del tablero.'
    render()
    enfocar('#titulo-juego')
  })

  enfocar('#titulo-final')
}

function render(): void {
  if (estado === null) {
    renderInicio()
  } else if (estado.resultado === 'en curso') {
    renderPartida(estado)
  } else {
    renderFinal(estado)
  }
}

render()
