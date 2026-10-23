import './LocalizacionRegional.css'
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

  const [cartografiaOSM, setCartografiaOSM] = useState(null)

  useEffect(() => {
    if (sistemaCoordenadas !== 'utm') {
      setCartografiaOSM(null)
      return
    }

    fetch(`${import.meta.env.BASE_URL}cartografia/los_cantos.geojson`)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error('GeoJSON no disponible')
        return respuesta.json()
      })
      .then(setCartografiaOSM)
      .catch((error) => {
        console.error('Error cartografía OSM:', error)
        setCartografiaOSM(null)
      })
  }, [sistemaCoordenadas])


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

    const predioXmin = Math.min(...estes)
    const predioXmax = Math.max(...estes)
    const predioYmin = Math.min(...nortes)
    const predioYmax = Math.max(...nortes)

    console.log('PUNTOS REALES RECIBIDOS POR LR:', coordenadasFinales)
    console.log('CENTRO REAL DEL PREDIO:', {
      este: centroEste,
      norte: centroNorte,
    })

    fetch(`${import.meta.env.BASE_URL}cartografia/indice_sectores.json`)
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

        const sectoresIntersectados = sectores.filter((sector) => {
          const esteSector = Number(sector.este)
          const norteSector = Number(sector.norte)
          const radioSector = Number(sector.radio)

          const xmin = esteSector - radioSector
          const xmax = esteSector + radioSector
          const ymin = norteSector - radioSector
          const ymax = norteSector + radioSector

          return !(
            predioXmax < xmin ||
            predioXmin > xmax ||
            predioYmax < ymin ||
            predioYmin > ymax
          )
        })

        console.log(
          'SECTORES INTERSECTADOS POR EL PREDIO:',
          sectoresIntersectados.map((sector) => sector.archivo)
        )

        const sectorEncontrado = sectores.find((sector) => {
          const esteSector = Number(sector.este)
          const norteSector = Number(sector.norte)
          const radioSector = Number(sector.radio)

          const xmin = esteSector - radioSector
          const xmax = esteSector + radioSector
          const ymin = norteSector - radioSector
          const ymax = norteSector + radioSector

          return coordenadasFinales.every((punto) => {
            const este = Number(punto.este)
            const norte = Number(punto.norte)

            return (
              Number.isFinite(este) &&
              Number.isFinite(norte) &&
              este >= xmin &&
              este <= xmax &&
              norte >= ymin &&
              norte <= ymax
            )
          })
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
      <div className="localizacion-regional localizacion-regional-12cm">
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
    500,
    dimensionPredio * 4
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

  const vistaPredio = (() => {
    if (predioVectorial.length === 0) {
      return { x: 0, y: 0, lado: 800 }
    }

    const xs = predioVectorial.map((punto) => punto.x)
    const ys = predioVectorial.map((punto) => punto.y)

    const xmin = Math.min(...xs)
    const xmax = Math.max(...xs)
    const ymin = Math.min(...ys)
    const ymax = Math.max(...ys)

    const ancho = xmax - xmin
    const alto = ymax - ymin

    const centroX = (xmin + xmax) / 2
    const centroY = (ymin + ymax) / 2

    const lado = Math.min(
      800,
      Math.max(80, Math.max(ancho, alto) * 2)
    )

    return {
      x: centroX - lado / 2,
      y: centroY - lado / 2,
      lado,
    }
  })()

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

  const nombresCalles = cartografiaHerrera
    ? (cartografiaHerrera.textos || [])
        .filter((texto) => texto.capa === 'NOMBRES DE CALLE')
        .map((texto, indice) => ({
          ...texto,
          id: indice,
          posicion: convertirNEaMapa(texto.este, texto.norte),
        }))
        .filter((texto) => texto.posicion)
    : []

  // Cuadrícula UTM real: intervalo de 250 metros
  const lineasUTM = []

  if (bbox && sistemaCoordenadas === 'utm') {
    const intervalo = 250

    const esteMin = Math.min(...estes) - radioRegional
    const esteMax = Math.max(...estes) + radioRegional
    const norteMin = Math.min(...nortes) - radioRegional
    const norteMax = Math.max(...nortes) + radioRegional

    const proyectarUTM = (este, norte) => {
      const geo = utm17NAGeograficas(este, norte)
      if (!geo) return null

      const mercator = geograficaAWebMercator(
        geo.latitud,
        geo.longitud
      )
      if (!mercator) return null

      return {
        x: ((mercator.x - bbox.xmin) / (bbox.xmax - bbox.xmin)) * 900,
        y: (1 - (mercator.y - bbox.ymin) / (bbox.ymax - bbox.ymin)) * 700,
      }
    }

    for (
      let este = Math.floor(esteMin / intervalo) * intervalo;
      este <= esteMax;
      este += intervalo
    ) {
      const a = proyectarUTM(este, norteMin)
      const b = proyectarUTM(este, norteMax)

      if (a && b) {
        lineasUTM.push({
          clave: `E-${este}`,
          este,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
        })
      }
    }

    for (
      let norte = Math.floor(norteMin / intervalo) * intervalo;
      norte <= norteMax;
      norte += intervalo
    ) {
      const a = proyectarUTM(esteMin, norte)
      const b = proyectarUTM(esteMax, norte)

      if (a && b) {
        lineasUTM.push({
          clave: `N-${norte}`,
          norte,
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
        })
      }
    }
  }


  const elementosOSM = cartografiaOSM && bbox
    ? cartografiaOSM.features.map((elemento, indice) => {
        const geometria = elemento.geometry
        if (!geometria) return null

        const proyectar = ([longitud, latitud]) => {
          const punto = geograficaAWebMercator(latitud, longitud)
          if (!punto) return null

          return {
            x: ((punto.x - bbox.xmin) / (bbox.xmax - bbox.xmin)) * 900,
            y: (1 - (punto.y - bbox.ymin) / (bbox.ymax - bbox.ymin)) * 700
          }
        }

        const tipo = geometria.type
        const coordenadas = geometria.coordinates

        if (tipo === 'Point') {
          return {
            indice,
            categoria: elemento.properties?.categoria,
            nombre: elemento.properties?.nombre,
            punto: proyectar(coordenadas)
          }
        }

        if (tipo === 'LineString' || tipo === 'MultiLineString') {
          const lineas = tipo === 'LineString'
            ? [coordenadas]
            : coordenadas

          const trazados = lineas.map((linea) =>
            linea.map(proyectar)
              .filter(Boolean)
              .map((punto) => `${punto.x},${punto.y}`)
              .join(' ')
          )

          return {
            indice,
            categoria: elemento.properties?.categoria,
            nombre: elemento.properties?.nombre,
            tipoVia: elemento.properties?.tipo,
            trazados
          }
        }

        if (tipo === 'Polygon' || tipo === 'MultiPolygon') {
          const poligonos = tipo === 'Polygon'
            ? [coordenadas]
            : coordenadas

          const superficies = poligonos.flatMap((poligono) =>
            poligono.map((anillo) =>
              anillo.map(proyectar)
                .filter(Boolean)
                .map((punto) => `${punto.x},${punto.y}`)
                .join(' ')
            )
          )

          return {
            indice,
            categoria: elemento.properties?.categoria,
            nombre: elemento.properties?.nombre,
            superficies
          }
        }

        return null
      }).filter(Boolean)
    : []

  const urlMapa = bbox
    ? `https://sigigntg.anati.gob.pa/arcgisserver/rest/services/Mapa_Web_de_Poblados_2025_MIL1/MapServer/export?bbox=${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}&bboxSR=3857&imageSR=3857&size=1800,1400&dpi=192&format=png32&transparent=false&f=image`
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




      {!cartografiaHerrera && sistemaCoordenadas === 'utm' && (
        <div style={{
          width: '120mm',
          height: '120mm',
          boxSizing: 'border-box',
          padding: '4mm',
          background: '#fff',
          border: '1px solid #111',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 5
          }}>
            LOCALIZACIÓN REGIONAL — VÍAS DE ACCESO
          </div>

          <svg
            viewBox="0 0 900 900"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              background: '#fff',
              border: '1px solid #333'
            }}
          >
            <g>
              {elementosOSM
                .filter(elemento =>
                  ['camino', 'carretera', 'via', 'calle'].includes(
                    (elemento.categoria || '').toLowerCase()
                  )
                )
                .flatMap(elemento =>
                  (elemento.trazados || []).map((trazado, indice) => (
                    <polyline
                      key={`via-${elemento.indice}-${indice}`}
                      points={trazado}
                      fill="none"
                      stroke="#111"
                      strokeWidth={
                        elemento.tipoVia === 'primary' ? 2.8 : 1.6
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))
                )}
            </g>

            <polygon
              points={puntosPoligono || ''}
              fill="none"
              stroke="#000"
              strokeWidth="4"
            />
          </svg>

          <div style={{
            textAlign: 'center',
            fontSize: 9,
            marginTop: 5
          }}>
            Cartografía vial — Localización Regional
          </div>
        </div>
      )}

      {cartografiaHerrera && (
        <div
          style={{
            marginTop: '12px',
            border: '1px solid #999',
            background: '#fff',
            width: '80%',
            maxWidth: '100%',
            boxSizing: 'border-box',
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
            viewBox={`${vistaPredio.x} ${vistaPredio.y} ${vistaPredio.lado} ${vistaPredio.lado}`}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              background: '#fff',
            }}
          >
            {(() => {
              const unidad = 800 / (cartografiaHerrera.radio * 2)
              const lado = 1000 * unidad

              const centroX = vistaPredio.x + vistaPredio.lado / 2
              const centroY = vistaPredio.y + vistaPredio.lado / 2

              const x0 = centroX - lado / 2
              const y0 = centroY - lado / 2

              const escalaX = x0 + lado * 0.055
              const escalaY = y0 + lado * 0.91
              const tramo = 50 * unidad

              return (
                <>
                  {/* CARTOGRAFÍA ORIGINAL */}
                  {geometriaVectorial.map((elemento) => {
                    const puntos = elemento.puntosMapa
                      .map((punto) => `${punto.x},${punto.y}`)
                      .join(' ')

                    return (
                      <polyline
                        key={`cartografia-${elemento.id}`}
                        points={puntos}
                        fill="none"
                        stroke="#999"
                        strokeWidth="0.65"
                        vectorEffect="non-scaling-stroke"
                      />
                    )
                  })}

                  {/* NOMBRES DE CALLES */}
                  {nombresCalles.map((calle) => (
                    <text
                      key={`calle-${calle.id}`}
                      x={calle.posicion.x}
                      y={calle.posicion.y}
                      fontSize="1.8"
                      fill="#333"
                      stroke="#fff"
                      strokeWidth="0.4"
                      paintOrder="stroke"
                      textAnchor="middle"
                    >
                      {calle.texto}
                    </text>
                  ))}

                  {/* LOTE */}
                  {predioVectorial.length > 0 && (
                    <g>
                      <circle
                        cx={centroX}
                        cy={centroY}
                        r={lado * 0.012}
                        fill="#000"
                        stroke="#fff"
                        strokeWidth="0.7"
                      />
                      <path
                        d={`M ${centroX + lado * 0.012} ${centroY - lado * 0.012}
                            L ${centroX + lado * 0.07} ${centroY - lado * 0.065}`}
                        fill="none"
                        stroke="#000"
                        strokeWidth={lado * 0.004}
                      />
                      <rect
                        x={centroX + lado * 0.07}
                        y={centroY - lado * 0.105}
                        width={lado * 0.105}
                        height={lado * 0.045}
                        fill="#fff"
                        stroke="#000"
                        strokeWidth={lado * 0.002}
                      />
                      <text
                        x={centroX + lado * 0.1225}
                        y={centroY - lado * 0.074}
                        fontSize={lado * 0.028}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="#000"
                      >
                        LOTE
                      </text>
                    </g>
                  )}

                  {/* ROSA DE LOS VIENTOS: NORTE UTM */}
                  <g transform={`translate(${x0 + lado * 0.88}, ${y0 + lado * 0.16})`}>
                    

                    <text
                      y={-lado * 0.072}
                      fontSize={lado * 0.028}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      N
                    </text>

                    <circle
                      cx="0"
                      cy={lado * 0.018}
                      r={lado * 0.052}
                      fill="none"
                      stroke="#000"
                      strokeWidth={lado * 0.002}
                    />

                    <path
                      d={`M 0 ${-lado * 0.048}
                          L ${-lado * 0.022} ${lado * 0.066}
                          L 0 ${lado * 0.042}
                          L ${lado * 0.022} ${lado * 0.066} Z`}
                      fill="#000"
                    />

                    <path
                      d={`M 0 ${-lado * 0.048}
                          L ${-lado * 0.022} ${lado * 0.066}
                          L 0 ${lado * 0.042} Z`}
                      fill="#fff"
                      stroke="#000"
                      strokeWidth={lado * 0.002}
                    />

                    <text
                      y={lado * 0.105}
                      fontSize={lado * 0.014}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      NORTE UTM
                    </text>
                  </g>


                </>
              )
            })()}
          </svg>
          {/* ESCALA GRÁFICA FUERA DE LA CARTOGRAFÍA */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '5px 8px 7px',
              background: '#fff',
              borderTop: 'none',
            }}
          >
            <div
              style={{
                width: 'min(100%, 330px)',
                border: 'none',
                padding: '2px 8px 3px',
                background: '#fff',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  marginBottom: '2px',
                  color: '#222',
                }}
              >
                ESCALA GRÁFICA
              </div>
              <svg
                viewBox="0 0 300 45"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <rect
                    key={i}
                    x={20 + i * 60}
                    y="5"
                    width="60"
                    height="14"
                    fill={i % 2 === 0 ? '#111' : '#fff'}
                    stroke="#111"
                    strokeWidth="1"
                  />
                ))}
                {[0, 50, 100, 150, 200].map((m, i) => (
                  <text
                    key={m}
                    x={20 + i * 60}
                    y="36"
                    fontSize="12"
                    fill="#111"
                    textAnchor="middle"
                  >
                    {m}
                  </text>
                ))}
                <text x="280" y="36" fontSize="12" fill="#111">
                  m
                </text>
              </svg>
            </div>
          </div>

        </div>
      )}


    </div>
  )
}

export default LocalizacionRegional
