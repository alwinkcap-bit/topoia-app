function DocumentoFinal({
  datosProyecto,
  levantamiento,
  volver,
  verCAD,
}) {
      const puntos = levantamiento?.puntos || []
      const segmentos = levantamiento?.segmentos || []

  const puntosValidos = puntos.filter(
    (p) =>
      p.norte !== '' &&
      p.este !== '' &&
      Number.isFinite(Number(p.norte)) &&
      Number.isFinite(Number(p.este))
  )
  const coordenadasFinales =
    levantamiento?.coordenadasAjustadas?.length > 0
      ? levantamiento.coordenadasAjustadas.filter(
          (punto) => punto.nombre !== 'M1 CIERRE'
        )
      : puntosValidos

  const crearPoligono = () => {
    if (coordenadasFinales.length < 3) return []

   const nortes = coordenadasFinales.map((p) => Number(p.norte))
const estes = coordenadasFinales.map((p) => Number(p.este))

    const minN = Math.min(...nortes)
    const maxN = Math.max(...nortes)
    const minE = Math.min(...estes)
    const maxE = Math.max(...estes)

    const rangoN = maxN - minN || 1
    const rangoE = maxE - minE || 1

    const ancho = 700
    const alto = 440
    const margen = 70

    const escala = Math.min(
      (ancho - margen * 2) / rangoE,
      (alto - margen * 2) / rangoN
    )

    const anchoReal = rangoE * escala
    const altoReal = rangoN * escala

    const offsetX = (ancho - anchoReal) / 2
    const offsetY = (alto - altoReal) / 2

    return coordenadasFinales.map((p) => ({
      ...p,
      x: offsetX + (Number(p.este) - minE) * escala,
      y: alto - (offsetY + (Number(p.norte) - minN) * escala),
    }))
  }

  const puntosGrafico = crearPoligono()

  const polygonPoints = puntosGrafico
    .map((p) => `${p.x},${p.y}`)
    .join(' ')
  
  const exportarDXF = () => {
    if (coordenadasFinales.length < 2) {
      alert('No hay suficientes coordenadas para generar el DXF.')
      return
    }

    const cerrado = levantamiento?.tipoLevantamiento === 'cerrado'

    const lineas = [
      '0',
      'SECTION',
      '2',
      'HEADER',
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'ENTITIES',
    ]

    // Polilínea del levantamiento
    lineas.push(
      '0',
      'LWPOLYLINE',
      '8',
      'LINDEROS',
      '90',
      String(coordenadasFinales.length),
      '70',
      cerrado ? '1' : '0'
    )

    coordenadasFinales.forEach((punto) => {
      lineas.push(
        '10',
        String(Number(punto.este)),
        '20',
        String(Number(punto.norte))
      )
    })

    // Puntos y nombres de vértices
    coordenadasFinales.forEach((punto) => {
      const este = Number(punto.este)
      const norte = Number(punto.norte)

      lineas.push(
        '0',
        'POINT',
        '8',
        'PUNTOS',
        '10',
        String(este),
        '20',
        String(norte),
        '30',
        '0'
      )

      lineas.push(
        '0',
        'TEXT',
        '8',
        'TEXTOS',
        '10',
        String(este + 1),
        '20',
        String(norte + 1),
        '30',
        '0',
        '40',
        '1.5',
        '1',
        String(punto.nombre)
      )
    })
    // Rumbos y distancias de los linderos
    segmentos.forEach((segmento) => {
      const desde = coordenadasFinales.find(
        (punto) => punto.nombre === segmento.desde
      )

      const hasta = coordenadasFinales.find(
        (punto) => punto.nombre === segmento.hasta
      )

      if (!desde || !hasta) return

      const x1 = Number(desde.este)
      const y1 = Number(desde.norte)
      const x2 = Number(hasta.este)
      const y2 = Number(hasta.norte)

      const medioX = (x1 + x2) / 2
      const medioY = (y1 + y2) / 2

      const dx = x2 - x1
      const dy = y2 - y1
      const longitud = Math.sqrt(dx ** 2 + dy ** 2) || 1

      // Desplazamiento perpendicular al lindero
      const separacion = 3

      const textoX =
        medioX + (-dy / longitud) * separacion

      const textoY =
        medioY + (dx / longitud) * separacion

      const distancia =
        segmento.distancia !== null
          ? `${Number(segmento.distancia).toFixed(3)} m`
          : ''

      const rumbo = segmento.rumbo || ''

      lineas.push(
        '0',
        'TEXT',
        '8',
        'RUMBOS_DISTANCIAS',
        '10',
        String(textoX),
        '20',
        String(textoY + 1),
        '30',
        '0',
        '40',
        '1.5',
        '1',
        distancia
      )

      lineas.push(
        '0',
        'TEXT',
        '8',
        'RUMBOS_DISTANCIAS',
        '10',
        String(textoX),
        '20',
        String(textoY - 1),
        '30',
        '0',
        '40',
        '1.5',
        '1',
        rumbo
      )
    })
        // Indicador Norte
    const estesCAD = coordenadasFinales.map(
      (punto) => Number(punto.este)
    )

    const nortesCAD = coordenadasFinales.map(
      (punto) => Number(punto.norte)
    )

    const maxEste = Math.max(...estesCAD)
    const maxNorte = Math.max(...nortesCAD)

    const norteX = maxEste + 15
    const norteY = maxNorte

    // Línea principal de la flecha
    lineas.push(
      '0',
      'LINE',
      '8',
      'NORTE',
      '10',
      String(norteX),
      '20',
      String(norteY),
      '30',
      '0',
      '11',
      String(norteX),
      '21',
      String(norteY + 20),
      '31',
      '0'
    )

    // Lado izquierdo de la punta
    lineas.push(
      '0',
      'LINE',
      '8',
      'NORTE',
      '10',
      String(norteX),
      '20',
      String(norteY + 20),
      '30',
      '0',
      '11',
      String(norteX - 3),
      '21',
      String(norteY + 14),
      '31',
      '0'
    )

    // Lado derecho de la punta
    lineas.push(
      '0',
      'LINE',
      '8',
      'NORTE',
      '10',
      String(norteX),
      '20',
      String(norteY + 20),
      '30',
      '0',
      '11',
      String(norteX + 3),
      '21',
      String(norteY + 14),
      '31',
      '0'
    )

    // Letra N
    lineas.push(
      '0',
      'TEXT',
      '8',
      'NORTE',
      '10',
      String(norteX - 1.5),
      '20',
      String(norteY + 24),
      '30',
      '0',
      '40',
      '3',
      '1',
      'N'
    )
    lineas.push(
      '0',
      'ENDSEC',
      '0',
      'EOF'
    )

    const contenidoDXF = lineas.join('\n')
    const blob = new Blob([contenidoDXF], {
      type: 'application/dxf',
    })

    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')

    const nombreProyecto =
      datosProyecto?.nombreProyecto
        ?.trim()
        .replace(/[^a-zA-Z0-9_-]+/g, '_') || 'plano_topografico'

    enlace.href = url
    enlace.download = `${nombreProyecto}.dxf`

    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()

    URL.revokeObjectURL(url)
  }
  return (
    <div className="nuevo-plano">
      <div className="nuevo-header">
        <button
          type="button"
          className="btn-volver"
          onClick={volver}
        >
          ← Verificación
        </button>

        <div>
          <span className="paso-label">TOPOIA</span>
          <h2>Documento final</h2>
          <p>
            Plano topográfico preparado para revisión, impresión y exportación.
          </p>
        </div>

        <div className="paso-indicador">
          <strong>✓</strong>
          <span>FINAL</span>
        </div>
      </div>

      <main className="form-plano">
        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>01</span>

            <div>
              <h3>Plano topográfico</h3>
              <p>
                Documento técnico generado con los datos del levantamiento.
              </p>
            </div>
          </div>
          <div className="datos-preview">
  <div>
    <span>PROYECTO</span>
    <strong>{datosProyecto?.nombreProyecto || '—'}</strong>
  </div>

  <div>
    <span>PROPIETARIO</span>
    <strong>{datosProyecto?.propietario || '—'}</strong>
  </div>

  <div>
    <span>UBICACIÓN</span>
    <strong>
      {[
        datosProyecto?.localidad,
        datosProyecto?.corregimiento,
        datosProyecto?.distrito,
        datosProyecto?.provincia,
      ]
        .filter(Boolean)
        .join(', ') || '—'}
    </strong>
  </div>

  <div>
    <span>PREDIO</span>
    <strong>{datosProyecto?.numeroPredio || '—'}</strong>
  </div>

  <div>
    <span>PROFESIONAL</span>
    <strong>{datosProyecto?.profesional || '—'}</strong>
  </div>

  <div>
    <span>IDONEIDAD</span>
    <strong>{datosProyecto?.idoneidad || '—'}</strong>
  </div>

  <div>
    <span>FECHA DEL LEVANTAMIENTO</span>
    <strong>{datosProyecto?.fechaLevantamiento || '—'}</strong>
  </div>
</div>
        </section>
        <section className="form-seccion">
  <div className="form-seccion-titulo">
    <span>02</span>

    <div>
      <h3>Resumen técnico</h3>
      <p>
        Resultados principales obtenidos del levantamiento topográfico.
      </p>
    </div>
  </div>

  <div className="datos-preview">
    <div>
      <span>TIPO</span>
      <strong>
        {levantamiento?.tipoLevantamiento === 'abierto'
          ? 'Recorrido abierto'
          : 'Polígono cerrado'}
      </strong>
    </div>

    <div>
      <span>MÉTODO</span>
      <strong>
        {levantamiento?.metodoEntrada === 'rumbos'
          ? 'Rumbos y distancias'
          : 'Coordenadas N/E'}
      </strong>
    </div>

    <div>
      <span>VÉRTICES</span>
      <strong>{levantamiento?.puntos?.length || 0}</strong>
    </div>

    <div>
      <span>ÁREA</span>
      <strong>
        {levantamiento?.tipoLevantamiento === 'abierto'
          ? 'No aplica'
          : `${Number(levantamiento?.area || 0).toFixed(3)} m²`}
      </strong>
    </div>

    <div>
      <span>
        {levantamiento?.tipoLevantamiento === 'abierto'
          ? 'LONGITUD TOTAL'
          : 'PERÍMETRO'}
      </span>
      <strong>
        {`${Number(levantamiento?.perimetro || 0).toFixed(3)} m`}
      </strong>
    </div>

    {levantamiento?.errorCierre && (
      <div>
        <span>PRECISIÓN</span>
        <strong>
          {Number.isFinite(levantamiento.errorCierre.precision)
            ? `1:${Math.round(levantamiento.errorCierre.precision)}`
            : 'Cierre exacto'}
        </strong>
      </div>
    )}
  </div>
</section>
<section className="form-seccion">
  <div className="form-seccion-titulo">
    <span>03</span>

    <div>
      <h3>Representación gráfica</h3>
      <p>
        Vista proporcional del levantamiento topográfico.
      </p>
    </div>
  </div>

  <div className="plano-preview">
    <div className="norte-indicador">
      <strong>N</strong>
      <span>↑</span>
    </div>

    {puntosGrafico.length >= 3 ? (
      <svg
        viewBox="0 0 700 440"
        className="poligono-svg"
        role="img"
        aria-label="Representación gráfica del levantamiento"
      >
        {levantamiento?.tipoLevantamiento === 'abierto' ? (
          <polyline
            points={polygonPoints}
            className="poligono-forma recorrido-abierto"
            fill="none"
          />
        ) : (
          <polygon
            points={polygonPoints}
            className="poligono-forma"
          />
        )}

        {puntosGrafico.map((p) => (
          <g key={p.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r="6"
              className="vertice"
            />

            <text
              x={p.x + 11}
              y={p.y - 11}
              className="vertice-texto"
            >
              {p.nombre}
            </text>
          </g>
        ))}
      </svg>
    ) : (
      <div className="plano-vacio">
        Se necesitan al menos 3 puntos válidos.
      </div>
    )}
  </div>
</section>
<section className="form-seccion">
  <div className="form-seccion-titulo">
    <span>04</span>

    <div>
      <h3>Cuadro de coordenadas</h3>
      <p>
        Coordenadas finales utilizadas para la representación del plano.
      </p>
    </div>
  </div>

  <div className="tabla-scroll">
    <table className="tabla-puntos">
      <thead>
        <tr>
          <th>Punto</th>
          <th>Norte</th>
          <th>Este</th>
        </tr>
      </thead>

      <tbody>
        {coordenadasFinales.map((punto, index) => (
          <tr key={`${punto.nombre}-${index}`}>
            <td>{punto.nombre}</td>
            <td>{Number(punto.norte).toFixed(4)}</td>
            <td>{Number(punto.este).toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
<section className="form-seccion">
  <div className="form-seccion-titulo">
    <span>05</span>

    <div>
      <h3>Rumbos y distancias</h3>
      <p>
        Información geométrica de los tramos del levantamiento.
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
                ? `${segmento.distancia.toFixed(3)} m`
                : '—'}
            </td>

            <td>{segmento.rumbo}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
<div className="form-acciones no-imprimir">
  <button
    type="button"
    className="btn-continuar"
    onClick={() => window.print()}
  >
    Imprimir / Guardar PDF
  </button>

  <button
    type="button"
    className="btn-continuar"
    onClick={verCAD}
  >
    Vista previa CAD
  </button>

<button
  type="button"
  className="btn-continuar"
  onClick={exportarDXF}
>
  Exportar DXF / AutoCAD
</button>
</div>
      </main>
    </div>
  )
}

export default DocumentoFinal