function VistaCAD({ levantamiento, volver }) {
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

  const puntosCAD = crearVistaCAD()
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
        ? `${Number(segmento.distancia).toFixed(3)} m`
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
  <line
    x1="0"
    y1="0"
    x2="160"
    y2="0"
    stroke="#263238"
    strokeWidth="3"
  />

  <line x1="0" y1="-7" x2="0" y2="7" stroke="#263238" strokeWidth="2" />
  <line x1="80" y1="-7" x2="80" y2="7" stroke="#263238" strokeWidth="2" />
  <line x1="160" y1="-7" x2="160" y2="7" stroke="#263238" strokeWidth="2" />

  <text x="0" y="22" textAnchor="middle" className="vertice-texto">
    0
  </text>

  <text x="80" y="22" textAnchor="middle" className="vertice-texto">
    {escalaGrafica / 2}
  </text>

  <text x="160" y="22" textAnchor="middle" className="vertice-texto">
    {escalaGrafica} m
  </text>
</g>
              </svg>
            ) : (
              <div className="plano-vacio">
                No hay suficientes coordenadas para mostrar el levantamiento.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default VistaCAD
