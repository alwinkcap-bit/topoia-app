import {
  crearBBoxRegional,
  utm17NAGeograficas,
  geograficaAWebMercator,
} from './geografia'

function LocalizacionRegional({
  ubicacionGeografica,
  datosProyecto,
  coordenadasFinales = [],
}) {
  if (!ubicacionGeografica) {
    return (
      <div className="localizacion-regional">
        <p>
          No hay coordenadas geográficas disponibles para generar
          la Localización Regional.
        </p>
      </div>
    )
  }

  const { latitud, longitud } = ubicacionGeografica

  const verticesGeograficos = coordenadasFinales
    .map((punto) =>
      utm17NAGeograficas(
        punto.este,
        punto.norte
      )
    )
    .filter(Boolean)

  console.log(
    'Vertices geograficos LR:',
    verticesGeograficos
  )

  const estes = coordenadasFinales
    .map((punto) => Number(punto.este))
    .filter(Number.isFinite)

  const nortes = coordenadasFinales
    .map((punto) => Number(punto.norte))
    .filter(Number.isFinite)

  const anchoPredio =
    estes.length > 0
      ? Math.max(...estes) - Math.min(...estes)
      : 0

  const altoPredio =
    nortes.length > 0
      ? Math.max(...nortes) - Math.min(...nortes)
      : 0

  const dimensionPredio = Math.max(
    anchoPredio,
    altoPredio
  )

  console.log('Dimension predio LR:', {
    anchoPredio,
    altoPredio,
    dimensionPredio,
  })


  const radioRegional = Math.max(
    750,
    dimensionPredio * 10
  )

  const bbox = crearBBoxRegional(
    latitud,
    longitud,
    radioRegional
  )

  const verticesMapa = bbox
    ? verticesGeograficos
        .map((punto) => {
          const mercator = geograficaAWebMercator(
            punto.latitud,
            punto.longitud
          )

          if (!mercator) return null

          const x =
            ((mercator.x - bbox.xmin) /
              (bbox.xmax - bbox.xmin)) *
            900

          const y =
            (1 -
              (mercator.y - bbox.ymin) /
                (bbox.ymax - bbox.ymin)) *
            700

          return { x, y }
        })
        .filter(Boolean)
    : []

  const puntosPoligono = verticesMapa
    .map((punto) => `${punto.x},${punto.y}`)
    .join(' ')

  const urlMapa = bbox
    ? `https://sigigntg.anati.gob.pa/arcgisserver/rest/services/Mapa_Web_de_Poblados_2025_MIL1/MapServer/export?bbox=${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}&bboxSR=3857&imageSR=3857&size=900,700&dpi=96&format=png32&transparent=false&f=image`
    : null

  return (
    <div className="localizacion-regional">
      <div>
        <strong>LOCALIZACIÓN REGIONAL</strong>
      </div>

      <div>
        <span>Provincia: </span>
        <strong>{datosProyecto?.provincia || 'Herrera'}</strong>
      </div>

      <div>
        <span>Distrito: </span>
        <strong>{datosProyecto?.distrito || '—'}</strong>
      </div>

      <div>
        <span>Corregimiento: </span>
        <strong>{datosProyecto?.corregimiento || '—'}</strong>
      </div>

      <div>
        <span>Centro geográfico: </span>
        <strong>
          {latitud.toFixed(6)}, {longitud.toFixed(6)}
        </strong>
      </div>

      {urlMapa && (
        <div
          style={{
            marginTop: '12px',
            border: '1px solid #999',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <img
              src={urlMapa}
              alt="Localización regional del predio"
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
              }}
            />

            {puntosPoligono && (
              <svg
                viewBox="0 0 900 700"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                <polygon
                  points={puntosPoligono}
                  fill="rgba(255, 215, 0, 0.35)"
                  stroke="#d40000"
                  strokeWidth="0.7"
                  vectorEffect="non-scaling-stroke"
                />

                {verticesMapa.map((punto, indice) => (
                  <g key={indice}>
                    <circle
                      cx={punto.x}
                      cy={punto.y}
                      r="5"
                      fill="#d40000"
                    />

                    <text
                      x={punto.x + 8}
                      y={punto.y - 8}
                      fontSize="18"
                      fill="#000"
                      stroke="#fff"
                      strokeWidth="0.35"
                      paintOrder="stroke"
                    >
                      {`M${indice + 1}`}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocalizacionRegional
