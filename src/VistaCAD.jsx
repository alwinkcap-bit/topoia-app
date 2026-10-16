import PlanoImpresion from './PlanoImpresion'
import DetalleAmarre from './DetalleAmarre'
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

      <PlanoImpresion datosProyecto={datosProyecto} levantamiento={levantamiento} coordenadasFinales={coordenadasCAD} ubicacionGeografica={ubicacionGeografica} />
    </div>
  )
}

export default VistaCAD
