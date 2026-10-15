import {
  calcularCentroPuntos,
  utm17NAGeograficas,
} from './geografia'
import LocalizacionRegional from './LocalizacionRegional'

function VistaCAD({ datosProyecto, levantamiento, volver }) {
      const puntos = levantamiento?.puntos || []

  const puntosValidos = puntos.filter(
    (punto) =>
      punto.norte !== '' &&
      punto.este !== '' &&
      Number.isFinite(Number(punto.norte)) &&
      Number.isFinite(Number(punto.este))
  )

  const coordenadasCAD =
    levantamiento?.coordenadasAjustadas?.length > 0
      ? levantamiento.coordenadasAjustadas.filter(
          (punto) => punto.nombre !== 'M1 CIERRE'
        )
      : puntosValidos
        const segmentos = levantamiento?.segmentos || []
        const ajusteBowditch = levantamiento?.ajusteBowditch || []

        const crearVistaCAD = () => {
    if (coordenadasCAD.length < 2) return []

    const nortes = coordenadasCAD.map((p) => Number(p.norte))
    const estes = coordenadasCAD.map((p) => Number(p.este))

    const minN = Math.min(...nortes)
    const maxN = Math.max(...nortes)
    const minE = Math.min(...estes)
    const maxE = Math.max(...estes)

    const rangoN = maxN - minN || 1
    const rangoE = maxE - minE || 1

    const ancho = 800
    const alto = 500
    const margen = 80

    const escala = Math.min(
      (ancho - margen * 2) / rangoE,
      (alto - margen * 2) / rangoN
    )

    const anchoReal = rangoE * escala
    const altoReal = rangoN * escala

    const offsetX = (ancho - anchoReal) / 2
    const offsetY = (alto - altoReal) / 2

    return coordenadasCAD.map((punto) => ({
      ...punto,
      x: offsetX + (Number(punto.este) - minE) * escala,
      y: alto - (offsetY + (Number(punto.norte) - minN) * escala),
    }))
  }

  const centroPredio = calcularCentroPuntos(coordenadasCAD)

  const ubicacionGeografica =
    levantamiento?.sistemaCoordenadas === 'utm' && centroPredio
      ? utm17NAGeograficas(
          centroPredio.este,
          centroPredio.norte
        )
      : null

  const puntosCAD = crearVistaCAD()
  const calcularFactorVista = () => {
  if (coordenadasCAD.length < 2) return 1

  const nortes = coordenadasCAD.map((p) => Number(p.norte))
  const estes = coordenadasCAD.map((p) => Number(p.este))

  const rangoN = Math.max(...nortes) - Math.min(...nortes) || 1
  const rangoE = Math.max(...estes) - Math.min(...estes) || 1

  const ancho = 800
  const alto = 500
  const margen = 80

  return Math.min(
    (ancho - margen * 2) / rangoE,
    (alto - margen * 2) / rangoN
  )
}

const factorVista = calcularFactorVista()
const calcularEscalaGrafica = () => {
  if (coordenadasCAD.length < 2) return 10

  const estes = coordenadasCAD.map((p) => Number(p.este))
  const rangoEste = Math.max(...estes) - Math.min(...estes)

  if (rangoEste <= 20) return 5
  if (rangoEste <= 50) return 10
  if (rangoEste <= 100) return 20
  if (rangoEste <= 250) return 50
  if (rangoEste <= 500) return 100
  if (rangoEste <= 1000) return 200

  return 500
}

const escalaGrafica = calcularEscalaGrafica()

const largoEscalaGrafica = Math.min(
  escalaGrafica * factorVista,
  200
)

const distanciaEscalaVisible = largoEscalaGrafica / factorVista
const mitadEscalaGrafica = largoEscalaGrafica / 2

  const puntosPolilinea = puntosCAD
    .map((punto) => `${punto.x},${punto.y}`)
    .join(' ')
    const centroCAD = {
  x:
    puntosCAD.reduce((suma, punto) => suma + punto.x, 0) /
    (puntosCAD.length || 1),
  y:
    puntosCAD.reduce((suma, punto) => suma + punto.y, 0) /
    (puntosCAD.length || 1),
}
      const etiquetasSegmentos = segmentos.map((segmento) => {
    const desde = puntosCAD.find(
      (punto) => punto.nombre === segmento.desde
    )

    const hasta = puntosCAD.find(
      (punto) => punto.nombre === segmento.hasta
    )

    if (!desde || !hasta) return null

  const dx = hasta.x - desde.x
const dy = hasta.y - desde.y
const longitud = Math.sqrt(dx ** 2 + dy ** 2) || 1

const separacion = 50

const medioX = (desde.x + hasta.x) / 2
const medioY = (desde.y + hasta.y) / 2

let normalX = -dy / longitud
let normalY = dx / longitud

const haciaCentroX = centroCAD.x - medioX
const haciaCentroY = centroCAD.y - medioY

const apuntaAlCentro =
  normalX * haciaCentroX + normalY * haciaCentroY > 0

if (apuntaAlCentro) {
  normalX *= -1
  normalY *= -1
}

const offsetX = normalX * separacion
const offsetY = normalY * separacion

return {
  ...segmento,
  x: (desde.x + hasta.x) / 2 + offsetX,
  y: (desde.y + hasta.y) / 2 + offsetY,
}
  }).filter(Boolean)

  return (
    <div className="nuevo-plano">
      <div className="nuevo-header">
        <button
          type="button"
          className="btn-volver"
          onClick={volver}
        >
          ← Documento final
        </button>

        <div>
          <span className="paso-label">TOPOIA CAD</span>
          <h2>Vista previa CAD</h2>
          <p>
            Representación del levantamiento antes de exportarlo.
          </p>
        </div>

        <div className="paso-indicador">
          <strong>CAD</strong>
          <span>VISTA</span>
        </div>
      </div>

      <main className="nuevo-contenido">
        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>01</span>

            <div>
              <h3>Modelo CAD</h3>
              <p>
                Aquí se mostrará la representación técnica del levantamiento.
              </p>
            </div>
          </div>
                    <div className="plano-preview">
            <div className="norte-indicador">
              <strong>N</strong>
              <span>↑</span>
            </div>

            {puntosCAD.length >= 2 ? (
              <svg
                viewBox="0 0 800 500"
                className="poligono-svg"
                role="img"
                aria-label="Vista previa CAD del levantamiento"
              >
                {levantamiento?.tipoLevantamiento === 'abierto' ? (
                  <polyline
                    points={puntosPolilinea}
                    className="poligono-forma recorrido-abierto"
                    fill="none"
                  />
                ) : (
                  <polygon
                    points={puntosPolilinea}
                    className="poligono-forma"
                  />
                )}

                {puntosCAD.map((punto, index) => (
                  <g key={`${punto.nombre}-${index}`}>
                    <circle
                      cx={punto.x}
                      cy={punto.y}
                      r="6"
                      className="vertice"
                    />

                    <text
                      x={punto.x + 12}
                      y={punto.y - 12}
                      className="vertice-texto"
                    >
                      {punto.nombre}
                    </text>
                  </g>
                ))}
                {etiquetasSegmentos.map((segmento, index) => (
  <g
    key={`segmento-${index}`}
    transform={`translate(${segmento.x} ${segmento.y})`}
  >
    <rect
      x="-65"
      y="-24"
      width="130"
      height="42"
      rx="5"
      fill="white"
      opacity="0.9"
    />

    <text
      x="0"
      y="-7"
      textAnchor="middle"
      className="vertice-texto"
    >
      {segmento.distancia !== null
        ? `${Number(segmento.distancia).toFixed(2)} m`
        : '—'}
    </text>

    <text
      x="0"
      y="10"
      textAnchor="middle"
      className="vertice-texto"
    >
      {segmento.rumbo || '—'}
    </text>
  </g>
))}
{/* Escala gráfica */}
<g transform="translate(80 455)">
  <rect
    x="-15"
    y="-35"
    width={Math.max(largoEscalaGrafica + 70, 150)}
    height="75"
    fill="white"
    opacity="0.92"
    rx="4"
  />

  <text
    x="0"
    y="-16"
    fontSize="12"
    fontWeight="bold"
    fill="#172b4d"
  >
    ESCALA GRÁFICA
  </text>

  <line
    x1="0"
    y1="0"
    x2={largoEscalaGrafica}
    y2="0"
    stroke="#172b4d"
    strokeWidth="3"
  />

  {[0, mitadEscalaGrafica, largoEscalaGrafica].map((x, i) => (
    <line
      key={i}
      x1={x}
      y1="-7"
      x2={x}
      y2="7"
      stroke="#172b4d"
      strokeWidth="2"
    />
  ))}

  <text x="0" y="23" textAnchor="middle" fontSize="11">0</text>

  <text
    x={mitadEscalaGrafica}
    y="23"
    textAnchor="middle"
    fontSize="11"
  >
    {(distanciaEscalaVisible / 2).toFixed(2)}
  </text>

  <text
    x={largoEscalaGrafica}
    y="23"
    textAnchor="middle"
    fontSize="11"
  >
    {distanciaEscalaVisible.toFixed(2)}
  </text>

  <text
    x={largoEscalaGrafica + 12}
    y="23"
    fontSize="11"
  >
    m
  </text>
</g>
              </svg>
            ) : (
              <div className="plano-vacio">
                No hay suficientes coordenadas para mostrar el levantamiento.
              </div>
            )}
          </div>
          {/* Localización regional del plano */}
          {levantamiento?.sistemaCoordenadas === 'utm' && (
            <section className="topoia-cad-localizacion">
              <h3>LOCALIZACIÓN REGIONAL</h3>
              <LocalizacionRegional
                ubicacionGeografica={ubicacionGeografica}
                datosProyecto={datosProyecto}
                coordenadasFinales={coordenadasCAD}
                sistemaCoordenadas="utm"
              />
            </section>
          )}

          {/* Cuadro de coordenadas */}
{coordenadasCAD.length > 0 && (
  <div className="cuadro-coordenadas-cad">
    <h3>Cuadro de Coordenadas Ajustadas</h3>

    <table>
      <thead>
        <tr>
          <th>Punto</th>
          <th>Norte (m)</th>
          <th>Este (m)</th>
        </tr>
      </thead>

      <tbody>
        {coordenadasCAD.map((punto, index) => (
          <tr key={`coord-${punto.nombre}-${index}`}>
            <td>{punto.nombre}</td>
            <td>{Number(punto.norte).toFixed(2)}</td>
            <td>{Number(punto.este).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
{/* Cuadro de ajuste Bowditch */}
{ajusteBowditch.length > 0 && (
  <div className="cuadro-coordenadas-cad">
    <h3>Ajuste Bowditch</h3>

    <table>
      <thead>
        <tr>
          <th>Tramo</th>
          <th>Corrección N (m)</th>
          <th>Corrección E (m)</th>
        </tr>
      </thead>

      <tbody>
        {ajusteBowditch.map((tramo, index) => (
          <tr key={`bowditch-${index}`}>
            <td>{tramo.desde} → {tramo.hasta}</td>
            <td>{Number(tramo.correccionN).toFixed(4)}</td>
            <td>{Number(tramo.correccionE).toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
        </section>
      </main>
    </div>
  )
}

export default VistaCAD
