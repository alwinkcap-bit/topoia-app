import { useEffect, useState } from 'react'
import {
  crearBBoxRegional,
  utm17NAGeograficas,
  geograficaAWebMercator,
} from './geografia'

function LocalizacionRegional({
  ubicacionGeografica,
  datosProyecto,
  coordenadasFinales = [],
  sistemaCoordenadas = 'local',
}) {
  const [cartografiaHerrera, setCartografiaHerrera] = useState(null)

  useEffect(() => {
    if (sistemaCoordenadas !== 'utm') {
      setCartografiaHerrera(null)
      return
    }

    const estes = coordenadasFinales
      .map((punto) => Number(punto.este))
      .filter(Number.isFinite)

    const nortes = coordenadasFinales
      .map((punto) => Number(punto.norte))
      .filter(Number.isFinite)

    if (estes.length === 0 || nortes.length === 0) {
      console.warn(
        'No hay coordenadas N/E suficientes para seleccionar cartografia.'
      )
      setCartografiaHerrera(null)
      return
    }

    const centroEste =
      estes.reduce((suma, valor) => suma + valor, 0) / estes.length

    const centroNorte =
      nortes.reduce((suma, valor) => suma + valor, 0) / nortes.length

    console.log('PUNTOS REALES RECIBIDOS POR LR:', coordenadasFinales)
    console.log('CENTRO REAL DEL PREDIO:', {
      este: centroEste,
      norte: centroNorte,
    })

    fetch('/cartografia/indice_sectores.json')
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('No se pudo cargar el indice de sectores.')
        }

        return respuesta.json()
      })
      .then((indice) => {
        const sectores = indice.sectores || []

        if (sectores.length === 0) {
          throw new Error('El indice no contiene sectores.')
        }

        const sectorEncontrado = sectores.find((sector) => {
          const esteSector = Number(sector.este)
          const norteSector = Number(sector.norte)
          const radioSector = Number(sector.radio)

          return (
            centroEste >= esteSector - radioSector &&
            centroEste <= esteSector + radioSector &&
            centroNorte >= norteSector - radioSector &&
            centroNorte <= norteSector + radioSector
          )
        })

        console.log('Centro predio para cartografia:', {
          este: centroEste,
          norte: centroNorte,
        })

        if (!sectorEncontrado) {
          throw new Error(
            `No existe sector cartografico para E=${centroEste.toFixed(2)} N=${centroNorte.toFixed(2)}`
          )
        }

        console.log('Sector cartografico seleccionado:', {
          archivo: sectorEncontrado.archivo,
          centro: {
            este: sectorEncontrado.este,
            norte: sectorEncontrado.norte,
          },
          radio: sectorEncontrado.radio,
        })

        return fetch(
          `/cartografia/${sectorEncontrado.archivo}`
        )
      })
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error(
            'No se pudo cargar el sector cartografico seleccionado.'
          )
        }

        return respuesta.json()
      })
      .then((datos) => {
        setCartografiaHerrera(datos)

        console.log('Cartografia Herrera cargada:', {
          centro: datos.centro,
          radio: datos.radio,
          geometrias: datos.elementos?.length || 0,
          textos: datos.textos?.length || 0,
        })
      })
      .catch((error) => {
        console.error(
          'Error cargando cartografia Herrera:',
          error
        )
        setCartografiaHerrera(null)
      })
  }, [coordenadasFinales, sistemaCoordenadas])

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

  const convertirNEaMapa = (este, norte) => {
    if (!cartografiaHerrera) return null

    const { centro, radio } = cartografiaHerrera

    const xmin = centro.este - radio
    const xmax = centro.este + radio
    const ymin = centro.norte - radio
    const ymax = centro.norte + radio

    return {
      x: ((Number(este) - xmin) / (xmax - xmin)) * 800,
      y: (1 - (Number(norte) - ymin) / (ymax - ymin)) * 800,
    }
  }

  const predioVectorial = coordenadasFinales
    .map((punto) =>
      convertirNEaMapa(
        Number(punto.este),
        Number(punto.norte)
      )
    )
    .filter(Boolean)

  const puntosPredioVectorial = predioVectorial
    .map((punto) => `${punto.x},${punto.y}`)
    .join(' ')

  const geometriaVectorial = cartografiaHerrera
    ? cartografiaHerrera.elementos
        .map((elemento, indice) => {
          const puntos = (elemento.puntos || [])
            .map(([este, norte]) =>
              convertirNEaMapa(este, norte)
            )
            .filter(Boolean)

          if (puntos.length < 2) return null

          return {
            ...elemento,
            id: indice,
            puntosMapa: puntos,
          }
        })
        .filter(Boolean)
    : []

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
        <span>Sistema de coordenadas: </span>
        <strong>
          {sistemaCoordenadas === 'utm' ? 'UTM' : 'LOCAL'}
        </strong>
      </div>

      <div>
        <span>Centro geográfico: </span>
        <strong>
          {sistemaCoordenadas === 'utm'
            ? `${latitud.toFixed(6)}, ${longitud.toFixed(6)}`
            : 'No disponible — coordenadas locales'}
        </strong>
      </div>

      {cartografiaHerrera && (
        <div
          style={{
            marginTop: '12px',
            border: '1px solid #999',
            background: '#fff',
          }}
        >
          <div
            style={{
              padding: '6px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            BASE CARTOGRÁFICA VECTORIAL — HERRERA
          </div>

          <svg
            viewBox="0 0 800 800"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              background: '#fff',
            }}
          >
            {geometriaVectorial.map((elemento) => {
              const puntos = elemento.puntosMapa
                .map((punto) => `${punto.x},${punto.y}`)
                .join(' ')

              return (
                <polyline
                  key={`cartografia-${elemento.id}`}
                  points={puntos}
                  fill={
                    elemento.cerrada
                      ? 'rgba(220,220,220,0.15)'
                      : 'none'
                  }
                  stroke="#777"
                  strokeWidth="0.7"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
            {puntosPredioVectorial && (
              <polygon
                points={puntosPredioVectorial}
                fill="rgba(255, 215, 0, 0.55)"
                stroke="#d40000"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        </div>
      )}

      {sistemaCoordenadas === 'utm' && urlMapa && (
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
