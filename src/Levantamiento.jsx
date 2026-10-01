import { useEffect, useMemo, useState } from 'react'

function calcularDistancia(p1, p2) {
  const n1 = Number(p1.norte)
  const e1 = Number(p1.este)
  const n2 = Number(p2.norte)
  const e2 = Number(p2.este)

  if (![n1, e1, n2, e2].every(Number.isFinite)) return null

  const deltaN = n2 - n1
  const deltaE = e2 - e1

  return Math.sqrt(deltaN ** 2 + deltaE ** 2)
}

function decimalAGMS(valor) {
  let grados = Math.floor(valor)
  const minutosDecimal = (valor - grados) * 60
  let minutos = Math.floor(minutosDecimal)
  let segundos = Math.round((minutosDecimal - minutos) * 60)

  if (segundos === 60) {
    segundos = 0
    minutos += 1
  }

  if (minutos === 60) {
    minutos = 0
    grados += 1
  }

  return `${grados}° ${String(minutos).padStart(2, '0')}' ${String(
    segundos
  ).padStart(2, '0')}"`
}

function calcularRumbo(p1, p2) {
  const n1 = Number(p1.norte)
  const e1 = Number(p1.este)
  const n2 = Number(p2.norte)
  const e2 = Number(p2.este)

  if (![n1, e1, n2, e2].every(Number.isFinite)) return '—'

  const deltaN = n2 - n1
  const deltaE = e2 - e1

  if (deltaN === 0 && deltaE === 0) return '—'

  const angulo =
    Math.atan2(Math.abs(deltaE), Math.abs(deltaN)) * (180 / Math.PI)

  const gms = decimalAGMS(angulo)

  if (deltaN >= 0 && deltaE >= 0) return `N ${gms} E`
  if (deltaN < 0 && deltaE >= 0) return `S ${gms} E`
  if (deltaN < 0 && deltaE < 0) return `S ${gms} W`

  return `N ${gms} W`
}

function calcularArea(puntos) {
  const validos = puntos.filter(
    (p) =>
      p.norte !== '' &&
      p.este !== '' &&
      Number.isFinite(Number(p.norte)) &&
      Number.isFinite(Number(p.este))
  )

  if (validos.length < 3) return 0

  let suma = 0

  for (let i = 0; i < validos.length; i++) {
    const actual = validos[i]
    const siguiente = validos[(i + 1) % validos.length]

    suma +=
      Number(actual.este) * Number(siguiente.norte) -
      Number(siguiente.este) * Number(actual.norte)
  }

  return Math.abs(suma) / 2
}

function Levantamiento({ volver, continuar }) {
  const datosGuardados = (() => {
  try {
    const datos = localStorage.getItem('topoia-levantamiento')
    return datos ? JSON.parse(datos) : null
  } catch {
    return null
  }
})()

   const [metodoEntrada, setMetodoEntrada] = useState(
  datosGuardados?.metodoEntrada || 'coordenadas'
)
    const [tipoLevantamiento, setTipoLevantamiento] = useState(
  datosGuardados?.tipoLevantamiento || 'cerrado'
)
const [puntoInicial, setPuntoInicial] = useState(
  datosGuardados?.puntoInicial || {
    norte: '',
    este: '',
  }
)
const [cierreObservado, setCierreObservado] = useState(
  datosGuardados?.cierreObservado || {
    ns: 'N',
    grados: '',
    minutos: '',
    segundos: '',
    eo: 'E',
    distancia: '',
  }
)
const actualizarCierreObservado = (campo, valor) => {
  setCierreObservado((anterior) => ({
    ...anterior,
    [campo]: valor,
  }))
}

const [rumbosDistancias, setRumbosDistancias] = useState(
  datosGuardados?.rumbosDistancias || [
  {
    id: 1,
    desde: 'M1',
    hasta: 'M2',
    ns: 'N',
    grados: '',
    minutos: '',
    segundos: '',
    eo: 'E',
    distancia: '',
  },
  {
    id: 2,
    desde: 'M2',
    hasta: 'M3',
    ns: 'N',
    grados: '',
    minutos: '',
    segundos: '',
    eo: 'E',
    distancia: '',
  },
  
  ]
)
const actualizarRumbo = (id, campo, valor) => {
  setRumbosDistancias((anteriores) =>
    anteriores.map((tramo) =>
      tramo.id === id
        ? { ...tramo, [campo]: valor }
        : tramo
    )
  )
}
const agregarTramo = () => {
  setRumbosDistancias((anteriores) => {
    const nuevoId =
      anteriores.length > 0
        ? Math.max(...anteriores.map((t) => t.id)) + 1
        : 1

    const numeroDesde = anteriores.length + 1
    const numeroHasta = numeroDesde + 1

    return [
      ...anteriores,
      {
        id: nuevoId,
        desde: `M${numeroDesde}`,
        hasta: `M${numeroHasta}`,
        ns: 'N',
        grados: '',
        minutos: '',
        segundos: '',
        eo: 'E',
        distancia: '',
      },
    ]
  })
}
const eliminarUltimoTramo = () => {
  setRumbosDistancias((anteriores) => {
    if (anteriores.length <= 1) return anteriores
    return anteriores.slice(0, -1)
  })
}
const rumboADeltas = (tramo) => {
  const grados = Number(tramo.grados) || 0
  const minutos = Number(tramo.minutos) || 0
  const segundos = Number(tramo.segundos) || 0
  const distancia = Number(tramo.distancia)

  if (!Number.isFinite(distancia) || distancia <= 0) {
    return null
  }

  const anguloDecimal =
    grados +
    minutos / 60 +
    segundos / 3600

  const anguloRad =
    anguloDecimal * (Math.PI / 180)

  let deltaN = Math.cos(anguloRad) * distancia
  let deltaE = Math.sin(anguloRad) * distancia

  if (tramo.ns === 'S') {
    deltaN *= -1
  }

  if (tramo.eo === 'W') {
    deltaE *= -1
  }

  return {
    deltaN,
    deltaE,
  }
}
const calcularErrorCierre = () => {
  if (tipoLevantamiento !== 'cerrado') return null

  const todosLosTramos = [
    ...rumbosDistancias,
    cierreObservado,
  ]

  let sumaDeltaN = 0
  let sumaDeltaE = 0
  let distanciaTotal = 0

  for (const tramo of todosLosTramos) {
    const deltas = rumboADeltas(tramo)
    const distancia = Number(tramo.distancia)

    if (!deltas || !Number.isFinite(distancia) || distancia <= 0) {
      return null
    }

    sumaDeltaN += deltas.deltaN
    sumaDeltaE += deltas.deltaE
    distanciaTotal += distancia
  }

  const errorLineal = Math.sqrt(
    sumaDeltaN ** 2 + sumaDeltaE ** 2
  )

  const toleranciaCierre = 0.001

const precision =
  errorLineal > toleranciaCierre
    ? distanciaTotal / errorLineal
    : Infinity

  return {
    errorNorte: sumaDeltaN,
    errorEste: sumaDeltaE,
    errorLineal,
    distanciaTotal,
    precision,
  }
}
const calcularAjusteBowditch = () => {
  if (tipoLevantamiento !== 'cerrado') return null
  if (!errorCierre) return null

  const tramos = [
    ...rumbosDistancias,
    cierreObservado,
  ]

  if (errorCierre.distanciaTotal <= 0) return null

  return tramos.map((tramo) => {
    const deltas = rumboADeltas(tramo)
    const distancia = Number(tramo.distancia)

    if (!deltas || !Number.isFinite(distancia) || distancia <= 0) {
      return null
    }

    const proporcion =
      distancia / errorCierre.distanciaTotal

    const correccionN =
      -errorCierre.errorNorte * proporcion

    const correccionE =
      -errorCierre.errorEste * proporcion

    return {
      desde: tramo.desde || `M${rumbosDistancias.length + 1}`,
      hasta: tramo.hasta || 'M1',
      distancia,
      deltaN: deltas.deltaN,
      deltaE: deltas.deltaE,
      correccionN,
      correccionE,
      deltaNAjustado: deltas.deltaN + correccionN,
      deltaEAjustado: deltas.deltaE + correccionE,
    }
  })
}
const calcularCoordenadasAjustadas = () => {
  if (!ajusteBowditch) return []

  const norteInicial = Number(puntoInicial.norte)
  const esteInicial = Number(puntoInicial.este)

  if (
    puntoInicial.norte === '' ||
    puntoInicial.este === '' ||
    !Number.isFinite(norteInicial) ||
    !Number.isFinite(esteInicial)
  ) {
    return []
  }

  const coordenadas = [
    {
      nombre: 'M1',
      norte: norteInicial,
      este: esteInicial,
    },
  ]

  let norteActual = norteInicial
  let esteActual = esteInicial

  ajusteBowditch.forEach((tramo, index) => {
    if (!tramo) return

    norteActual += tramo.deltaNAjustado
    esteActual += tramo.deltaEAjustado

    coordenadas.push({
      nombre:
        index === ajusteBowditch.length - 1
          ? 'M1 CIERRE'
          : tramo.hasta,
      norte: norteActual,
      este: esteActual,
    })
  })

  return coordenadas
}
const calcularCoordenadasDesdeRumbos = () => {
  const norteInicial = Number(puntoInicial.norte)
  const esteInicial = Number(puntoInicial.este)

  if (
    puntoInicial.norte === '' ||
    puntoInicial.este === '' ||
    !Number.isFinite(norteInicial) ||
    !Number.isFinite(esteInicial)
  ) {
    return []
  }

  const coordenadas = [
    {
      nombre: 'M1',
      norte: norteInicial,
      este: esteInicial,
    },
  ]

  let norteActual = norteInicial
  let esteActual = esteInicial

  rumbosDistancias.forEach((tramo) => {
    const deltas = rumboADeltas(tramo)

    if (!deltas) return

    norteActual += deltas.deltaN
    esteActual += deltas.deltaE

    coordenadas.push({
      nombre: tramo.hasta,
      norte: norteActual,
      este: esteActual,
    })
  })

  return coordenadas
}

const [puntos, setPuntos] = useState(
  datosGuardados?.puntos || [
    { id: 1, nombre: 'M1', norte: '', este: '', descripcion: '' },
    { id: 2, nombre: 'M2', norte: '', este: '', descripcion: '' },
    { id: 3, nombre: 'M3', norte: '', este: '', descripcion: '' },
  ]
)
const [colindancias, setColindancias] = useState(
  datosGuardados?.colindancias || {}
)
 useEffect(() => {
  try {
    localStorage.setItem(
      'topoia-levantamiento',
   JSON.stringify({
  metodoEntrada,
  tipoLevantamiento,
  puntoInicial,
  rumbosDistancias,
  cierreObservado,
  puntos,
  colindancias,
})

    )
  } catch {
    // Si localStorage no está disponible, la app continúa normalmente.
  }
}, [
  metodoEntrada,
  tipoLevantamiento,
  puntoInicial,
  rumbosDistancias,
  cierreObservado,
  puntos,
   colindancias
])
const coordenadasCalculadas = calcularCoordenadasDesdeRumbos()
const puntosActivos =
  metodoEntrada === 'rumbos'
    ? coordenadasCalculadas.map((punto, index) => ({
        id: index + 1,
        nombre: punto.nombre,
        norte: punto.norte,
        este: punto.este,
        descripcion: '',
      }))
    : puntos
  

  const actualizarPunto = (id, campo, valor) => {
    setPuntos((anteriores) =>
      anteriores.map((p) =>
        p.id === id ? { ...p, [campo]: valor } : p
      )
    )
  }
const actualizarColindancia = (desde, hasta, valor) => {
  const clave = `${desde}-${hasta}`

  setColindancias((anteriores) => ({
    ...anteriores,
    [clave]: valor,
  }))
}
  const agregarPunto = () => {
    const nuevoId =
      puntos.length === 0 ? 1 : Math.max(...puntos.map((p) => p.id)) + 1

    setPuntos((anteriores) => [
      ...anteriores,
      {
        id: nuevoId,
        nombre: `M${nuevoId}`,
        norte: '',
        este: '',
        descripcion: '',
      },
    ])
  }

  const eliminarPunto = (id) => {
    if (puntos.length <= 3) return

    setPuntos((anteriores) =>
      anteriores.filter((p) => p.id !== id)
    )
  }

const segmentos = useMemo(() => {
  if (puntosActivos.length < 2) return []

  // Recorrido abierto:
  // calcula cada tramo consecutivo, pero NO vuelve al punto inicial.
  if (tipoLevantamiento === 'abierto') {
    return puntosActivos.slice(0, -1).map((punto, index) => {
      const siguiente = puntosActivos[index + 1]

      return {
        desde: punto.nombre,
        hasta: siguiente.nombre,
        distancia: calcularDistancia(punto, siguiente),
        rumbo: calcularRumbo(punto, siguiente),
      }
    })
  }

  // Con solo 2 puntos no existe todavía un polígono.
  if (puntosActivos.length === 2) {
    const punto = puntosActivos[0]
    const siguiente = puntosActivos[1]

    return [
      {
        desde: punto.nombre,
        hasta: siguiente.nombre,
        distancia: calcularDistancia(punto, siguiente),
        rumbo: calcularRumbo(punto, siguiente),
      },
    ]
  }

  // Polígono cerrado:
  // conecta también el último vértice con el primero.
  return puntosActivos.map((punto, index) => {
    const siguiente =
      puntosActivos[(index + 1) % puntosActivos.length]

    return {
      desde: punto.nombre,
      hasta: siguiente.nombre,
      distancia: calcularDistancia(punto, siguiente),
      rumbo: calcularRumbo(punto, siguiente),
    }
  })
}, [puntosActivos, tipoLevantamiento])
const errorCierre = calcularErrorCierre()
const ajusteBowditch = calcularAjusteBowditch()
const coordenadasAjustadas = calcularCoordenadasAjustadas()
const coordenadasFinalesAjustadas = coordenadasAjustadas.filter(
  (punto) => punto.nombre !== 'M1 CIERRE'
)

const longitudObservada = useMemo(() => {
  if (metodoEntrada !== 'rumbos') return null

  const tramos =
    tipoLevantamiento === 'cerrado'
      ? [...rumbosDistancias, cierreObservado]
      : rumbosDistancias

  let total = 0

  for (const tramo of tramos) {
    const distancia = Number(tramo.distancia)

    if (!Number.isFinite(distancia) || distancia <= 0) {
      return null
    }

    total += distancia
  }

  return total
}, [
  metodoEntrada,
  tipoLevantamiento,
  rumbosDistancias,
  cierreObservado,
])

const perimetro = useMemo(() => {
  return segmentos.reduce(
    (total, segmento) => total + (segmento.distancia || 0),
    0
  )
}, [segmentos])

const area = useMemo(() => {
  if (tipoLevantamiento === 'abierto') return 0
  if (puntosActivos.length < 3) return 0

  return calcularArea(puntosActivos)
}, [puntosActivos, tipoLevantamiento])
const areaAjustada =
  tipoLevantamiento === 'cerrado' &&
  metodoEntrada === 'rumbos' &&
  coordenadasFinalesAjustadas.length >= 3
    ? calcularArea(coordenadasFinalesAjustadas)
    : area

const perimetroAjustado =
  tipoLevantamiento === 'cerrado' &&
  metodoEntrada === 'rumbos' &&
  coordenadasFinalesAjustadas.length >= 3
    ? coordenadasFinalesAjustadas.reduce((total, punto, index) => {
        const siguiente =
          coordenadasFinalesAjustadas[
            (index + 1) % coordenadasFinalesAjustadas.length
          ]

        return total + (calcularDistancia(punto, siguiente) || 0)
      }, 0)
    : perimetro

  return (
    <div className="nuevo-plano">
      <div className="nuevo-header">
        <button
          type="button"
          className="btn-volver"
          onClick={volver}
        >
          ← Datos del predio
        </button>

        <div>
          <span className="paso-label">NUEVO PLANO</span>
          <h2>Levantamiento</h2>
          <p>
            Introduce las coordenadas Norte y Este de los vértices
            del polígono.
          </p>
        </div>

        <div className="paso-indicador">
          <strong>02</strong>
          <span>de 04</span>
        </div>
      </div>

      <div className="progreso">
        <div
          className="progreso-activo"
          style={{ width: '50%' }}
        />
      </div>
<div className="selector-metodo">
  <div className="selector-metodo-titulo">
    <span>MÉTODO DE LEVANTAMIENTO</span>
    <p>Selecciona cómo deseas ingresar los datos del polígono.</p>
  </div>

  <div className="metodo-botones">
    <button
      type="button"
      className={
        metodoEntrada === 'coordenadas'
          ? 'metodo-btn activo'
          : 'metodo-btn'
      }
      onClick={() => setMetodoEntrada('coordenadas')}
    >
      <strong>Coordenadas N/E</strong>
      <span>Ingresar Norte y Este de cada vértice</span>
    </button>

    <button
      type="button"
      className={
        metodoEntrada === 'rumbos'
          ? 'metodo-btn activo'
          : 'metodo-btn'
      }
      onClick={() => setMetodoEntrada('rumbos')}
    >
      <strong>Rumbos y Distancias</strong>
      <span>Ingresar dirección, ángulo y distancia</span>
    </button>
  </div>
</div>
<div className="selector-metodo">
  <div className="selector-metodo-titulo">
    <span>TIPO DE LEVANTAMIENTO</span>
    <p>Selecciona si el recorrido es cerrado o abierto.</p>
  </div>

  <div className="metodo-botones">
    <button
      type="button"
      className={
        tipoLevantamiento === 'cerrado'
          ? 'metodo-btn activo'
          : 'metodo-btn'
      }
      onClick={() => setTipoLevantamiento('cerrado')}
    >
      <strong>Polígono cerrado</strong>
      <span>El último punto se conecta con el punto inicial</span>
    </button>

    <button
      type="button"
      className={
        tipoLevantamiento === 'abierto'
          ? 'metodo-btn activo'
          : 'metodo-btn'
      }
      onClick={() => setTipoLevantamiento('abierto')}
    >
      <strong>Recorrido abierto</strong>
      <span>El último punto no se conecta con el inicial</span>
    </button>
  </div>
</div>
      <main className="form-plano">
        {metodoEntrada === 'rumbos' && (
  <section className="form-seccion">
    <div className="form-seccion-titulo">
      <span>01</span>

      <div>
        <h3>Rumbos y Distancias</h3>
        <p>
          Ingresa el punto inicial y los datos de cada tramo
          del levantamiento.
        </p>
      </div>
    </div>

    <div className="punto-inicial">
      <div className="campo">
        <label>Norte inicial (N)</label>
        <input
          type="number"
          step="0.001"
          value={puntoInicial.norte}
          onChange={(e) =>
            setPuntoInicial({
              ...puntoInicial,
              norte: e.target.value,
            })
          }
          placeholder="Ej. 1000.000"
        />
      </div>

      <div className="campo">
        <label>Este inicial (E)</label>
        <input
          type="number"
          step="0.001"
          value={puntoInicial.este}
          onChange={(e) =>
            setPuntoInicial({
              ...puntoInicial,
              este: e.target.value,
            })
          }
          placeholder="Ej. 500.000"
        />
      </div>
    </div>

    <div className="tabla-scroll">
      <table className="tabla-puntos tabla-rumbos">
        <thead>
          <tr>
            <th>Desde</th>
            <th>Hasta</th>
            <th>N/S</th>
            <th>Grados</th>
            <th>Min</th>
            <th>Seg</th>
            <th>E/O</th>
            <th>Distancia</th>
          </tr>
        </thead>

        <tbody>
          {rumbosDistancias.map((tramo) => (
            <tr key={tramo.id}>
              <td>{tramo.desde}</td>
              <td>{tramo.hasta}</td>
              <td>
  <select
    value={tramo.ns}
    onChange={(e) =>
      actualizarRumbo(tramo.id, 'ns', e.target.value)
    }
    className="rumbo-select"
  >
    <option value="N">N</option>
    <option value="S">S</option>
  </select>
</td>
              <td>
  <input
    type="number"
    min="0"
    max="90"
    step="1"
    value={tramo.grados}
    onChange={(e) =>
      actualizarRumbo(tramo.id, 'grados', e.target.value)
    }
    className="rumbo-input"
    placeholder="0"
  />
</td>
              <td>
  <input
    type="number"
    min="0"
    max="59"
    step="1"
    value={tramo.minutos}
    onChange={(e) =>
      actualizarRumbo(tramo.id, 'minutos', e.target.value)
    }
    className="rumbo-input"
    placeholder="0"
  />
</td>

<td>
  <input
    type="number"
    min="0"
    max="59"
    step="1"
    value={tramo.segundos}
    onChange={(e) =>
      actualizarRumbo(tramo.id, 'segundos', e.target.value)
    }
    className="rumbo-input"
    placeholder="0"
  />
</td>
         <td>
  <select
    value={tramo.eo}
    onChange={(e) =>
      actualizarRumbo(tramo.id, 'eo', e.target.value)
    }
    className="rumbo-select"
  >
    <option value="E">E</option>
    <option value="W">O</option>
  </select>
</td>

<td>
  <input
    type="number"
    min="0"
    step="0.001"
    value={tramo.distancia}
    onChange={(e) =>
      actualizarRumbo(tramo.id, 'distancia', e.target.value)
    }
    className="rumbo-input rumbo-distancia"
    placeholder="0.000"
  />
</td>
            </tr>
          ))}
          {tipoLevantamiento === 'cerrado' && (
  <tr>
    <td>{`M${rumbosDistancias.length + 1}`}</td>
    <td>M1</td>

    <td>
      <select
        value={cierreObservado.ns}
        onChange={(e) =>
          actualizarCierreObservado('ns', e.target.value)
        }
        className="rumbo-select"
      >
        <option value="N">N</option>
        <option value="S">S</option>
      </select>
    </td>

    <td>
      <input
        type="number"
        min="0"
        max="90"
        step="1"
        value={cierreObservado.grados}
        onChange={(e) =>
          actualizarCierreObservado('grados', e.target.value)
        }
        className="rumbo-input"
        placeholder="0"
      />
    </td>

    <td>
      <input
        type="number"
        min="0"
        max="59"
        step="1"
        value={cierreObservado.minutos}
        onChange={(e) =>
          actualizarCierreObservado('minutos', e.target.value)
        }
        className="rumbo-input"
        placeholder="0"
      />
    </td>

    <td>
      <input
        type="number"
        min="0"
        max="59"
        step="1"
        value={cierreObservado.segundos}
        onChange={(e) =>
          actualizarCierreObservado('segundos', e.target.value)
        }
        className="rumbo-input"
        placeholder="0"
      />
    </td>

    <td>
      <select
        value={cierreObservado.eo}
        onChange={(e) =>
          actualizarCierreObservado('eo', e.target.value)
        }
        className="rumbo-select"
      >
        <option value="E">E</option>
        <option value="W">O</option>
      </select>
    </td>

    <td>
      <input
        type="number"
        min="0"
        step="0.001"
        value={cierreObservado.distancia}
        onChange={(e) =>
          actualizarCierreObservado('distancia', e.target.value)
        }
        className="rumbo-input rumbo-distancia"
        placeholder="0.000"
      />
    </td>
  </tr>
)}
        </tbody>
      </table>
    </div>
    <button
  type="button"
  className="btn-agregar-punto"
  onClick={agregarTramo}
>
  + AGREGAR TRAMO
</button>
<button
  type="button"
  className="btn-eliminar-tramo"
  onClick={eliminarUltimoTramo}
  disabled={rumbosDistancias.length <= 1}
>
  − Eliminar último tramo
</button>
    {coordenadasCalculadas.length > 0 && (
  <div className="coordenadas-calculadas">
    <div className="coordenadas-calculadas-titulo">
      <span>COORDENADAS CALCULADAS</span>
      <p>
        Coordenadas obtenidas automáticamente a partir
        de los rumbos y distancias.
      </p>
    </div>

    <div className="tabla-scroll">
      <table className="tabla-puntos">
        <thead>
          <tr>
            <th>Punto</th>
            <th>Norte (N)</th>
            <th>Este (E)</th>
          </tr>
        </thead>

        <tbody>
          {coordenadasCalculadas.map((punto, index) => (
            <tr key={index}>
              <td>
                <strong>{punto.nombre}</strong>
              </td>

              <td>
                {Number(punto.norte).toFixed(2)}
              </td>

              <td>
                {Number(punto.este).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
  </section>
)}
{metodoEntrada === 'coordenadas' && (
        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>01</span>

            <div>
              <h3>Coordenadas del polígono</h3>
              <p>
                Las distancias y rumbos se calcularán automáticamente.
              </p>
            </div>
          </div>

          <div className="tabla-scroll">
            <table className="tabla-puntos">
              <thead>
                <tr>
                  <th>Punto</th>
                  <th>Norte (N)</th>
                  <th>Este (E)</th>
                  <th>Descripción</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {puntos.map((punto) => (
                  <tr key={punto.id}>
                    <td>
                      <input
                        value={punto.nombre}
                        onChange={(e) =>
                          actualizarPunto(
                            punto.id,
                            'nombre',
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.001"
                        value={punto.norte}
                        onChange={(e) =>
                          actualizarPunto(
                            punto.id,
                            'norte',
                            e.target.value
                          )
                        }
                        placeholder="0.000"
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.001"
                        value={punto.este}
                        onChange={(e) =>
                          actualizarPunto(
                            punto.id,
                            'este',
                            e.target.value
                          )
                        }
                        placeholder="0.000"
                      />
                    </td>

                    <td>
                      <input
                        value={punto.descripcion}
                        onChange={(e) =>
                          actualizarPunto(
                            punto.id,
                            'descripcion',
                            e.target.value
                          )
                        }
                        placeholder="Opcional"
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-eliminar"
                        onClick={() => eliminarPunto(punto.id)}
                        disabled={puntos.length <= 3}
                        title="Eliminar punto"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="btn-agregar-punto"
            onClick={agregarPunto}
          >
            + Agregar punto
          </button>
        </section>
)}
        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>02</span>

            <div>
             <h3>
  {tipoLevantamiento === 'cerrado'
    ? 'Cálculos del polígono'
    : 'Cálculos del recorrido'}
</h3>
              <p>
               Resultados geométricos y control de cierre del levantamiento.
              </p>
            </div>
          </div>

          <div className="resumen-calculos">
            <div>
              <span>VÉRTICES</span>
              <strong>{puntosActivos.length}</strong>
            </div>

            <div>
              <span>
  {tipoLevantamiento === 'cerrado' ? 'PERÍMETRO' : 'LONGITUD TOTAL'}
</span>
              <strong>
  {(tipoLevantamiento === 'cerrado' && metodoEntrada === 'rumbos'
    ? perimetroAjustado
    : perimetro
  ).toFixed(3)} m
</strong>
            </div>
{metodoEntrada === 'rumbos' && (
  <div>
    <span>LONGITUD OBSERVADA</span>
    <strong>
      {longitudObservada !== null
        ? `${longitudObservada.toFixed(2)} m`
        : 'PENDIENTE'}
    </strong>
  </div>
)}

            <div>
              <span>ÁREA</span>
              <strong>
  {tipoLevantamiento === 'cerrado'
    ? `${areaAjustada.toFixed(2)} m²`
    : 'NO APLICA'}
</strong>
            </div>
          </div>
        
{tipoLevantamiento === 'cerrado' &&
  metodoEntrada === 'rumbos' && (
    errorCierre ? (
      <>
        <div className="resumen-calculos">
          <div>
            <span>ERROR NORTE</span>
            <strong>{errorCierre.errorNorte.toFixed(2)} m</strong>
          </div>

          <div>
            <span>ERROR ESTE</span>
            <strong>{errorCierre.errorEste.toFixed(2)} m</strong>
          </div>

          <div>
            <span>ERROR LINEAL</span>
            <strong>{errorCierre.errorLineal.toFixed(2)} m</strong>
          </div>

          <div>
            <span>PRECISIÓN</span>
            <strong>
              {Number.isFinite(errorCierre.precision)
                ? `1:${Math.round(errorCierre.precision)}`
                : 'CIERRE EXACTO'}
            </strong>
          </div>
        </div>

        {Number.isFinite(errorCierre.precision) &&
          errorCierre.precision < 1000 && (
            <div className="alerta-cierre">
              ⚠️ Cierre topográfico fuera del nivel de control configurado.
              Revise rumbos, cuadrantes (N/S - E/W) y distancias antes de
              aplicar el ajuste Bowditch.
            </div>
          )}
      </>
    ) : (
      <div>
        <p>
          Complete todos los rumbos y distancias, incluido el tramo de cierre,
          para calcular el error y la precisión.
        </p>
      </div>
    )
  )}
{ajusteBowditch && (
  <div className="tabla-resultados">
    <h4>Ajuste Bowditch</h4>

    <div className="tabla-scroll">
      <table>
        <thead>
          <tr>
            <th>Tramo</th>
            <th>Corr. N</th>
            <th>Corr. E</th>
            <th>ΔN ajustado</th>
            <th>ΔE ajustado</th>
          </tr>
        </thead>

        <tbody>
          {ajusteBowditch.map((tramo, index) => (
            <tr key={index}>
              <td>{tramo.desde} → {tramo.hasta}</td>
              <td>{tramo.correccionN.toFixed(4)}</td>
              <td>{tramo.correccionE.toFixed(4)}</td>
              <td>{tramo.deltaNAjustado.toFixed(4)}</td>
              <td>{tramo.deltaEAjustado.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
        <h4>Coordenadas ajustadas</h4>

    <div className="tabla-scroll">
      <table>
        <thead>
          <tr>
            <th>Punto</th>
            <th>Norte</th>
            <th>Este</th>
          </tr>
        </thead>

        <tbody>
          {coordenadasAjustadas.map((punto, index) => (
            <tr key={index}>
              <td>{punto.nombre}</td>
              <td>{punto.norte.toFixed(4)}</td>
              <td>{punto.este.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
</section>

<section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>03</span>
 <div>
  <h3>Distancias y rumbos geométricos</h3>
  <p>
    Valores calculados automáticamente a partir de las coordenadas
    de los vértices.
  </p>
</div>
          </div>

          <div className="tabla-scroll">
            <table className="tabla-puntos">
              <thead>
                <tr>
                  <th>Estación</th>
                  <th>Distancia</th>
                  <th>Rumbo</th>
                   <th>Colindante</th>
                </tr>
              </thead>

              <tbody>
                {segmentos.map((segmento, index) => (
                  <tr key={index}>
                    <td>
                      {segmento.desde} – {segmento.hasta}
                    </td>

                    <td>
                      {segmento.distancia !== null
                        ? `${segmento.distancia.toFixed(2)} m`
                        : '—'}
                    </td>

                    <td>{segmento.rumbo}</td>
                    <td>
  <input
    type="text"
    value={colindancias[`${segmento.desde}-${segmento.hasta}`] || ''}
    onChange={(e) =>
      actualizarColindancia(
        segmento.desde,
        segmento.hasta,
        e.target.value
      )
    }
    placeholder="Folio Real / propietario / calle"
  />
</td>
 
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="form-acciones">
          <button
            type="button"
            className="btn-secundario"
            onClick={volver}
          >
            ← Atrás
          </button>

          <button
            type="button"
            className="btn-continuar"
            onClick={() =>
              continuar &&
              continuar({
  metodoEntrada,
  tipoLevantamiento,
  puntos: puntosActivos,
  segmentos,
  colindancias,
 perimetro,
perimetroAjustado,
area,
areaAjustada,
longitudObservada,
errorCierre,
ajusteBowditch,
coordenadasAjustadas,
})
            }
          >
            Generar plano →
          </button>
        </div>
      </main>
    </div>
  )
}

export default Levantamiento