function GenerarPlano({ datosProyecto, levantamiento, volver }) {
  const puntos = levantamiento?.puntos || []
  const segmentos = levantamiento?.segmentos || []
  const area = levantamiento?.area || 0
  const perimetro = levantamiento?.perimetro || 0

  const puntosValidos = puntos.filter(
    (p) =>
      p.norte !== '' &&
      p.este !== '' &&
      Number.isFinite(Number(p.norte)) &&
      Number.isFinite(Number(p.este))
  )

  const crearPoligono = () => {
    if (puntosValidos.length < 3) return []

    const nortes = puntosValidos.map((p) => Number(p.norte))
    const estes = puntosValidos.map((p) => Number(p.este))

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

    return puntosValidos.map((p) => ({
      ...p,
      x: offsetX + (Number(p.este) - minE) * escala,
      y: alto - (offsetY + (Number(p.norte) - minN) * escala),
    }))
  }

  const puntosGrafico = crearPoligono()

  const polygonPoints = puntosGrafico
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  return (
    <div className="nuevo-plano">
      <div className="nuevo-header">
        <button
          type="button"
          className="btn-volver"
          onClick={volver}
        >
          ← Levantamiento
        </button>

        <div>
          <span className="paso-label">NUEVO PLANO</span>
          <h2>Generación del plano</h2>
          <p>
            Vista preliminar construida a partir de las coordenadas
            del levantamiento.
          </p>
        </div>

        <div className="paso-indicador">
          <strong>03</strong>
          <span>de 04</span>
        </div>
      </div>

      <div className="progreso">
        <div
          className="progreso-activo"
          style={{ width: '75%' }}
        />
      </div>

      <main className="form-plano">

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>01</span>

            <div>
              <h3>Vista del polígono</h3>
              <p>
                Representación proporcional de las coordenadas
                ingresadas.
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
                aria-label="Vista preliminar del polígono"
              >
                <polygon
                  points={polygonPoints}
                  className="poligono-forma"
                />

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

        <section className="resumen-plano">
          <div>
            <span>ÁREA</span>
            <strong>{Number(area).toFixed(3)} m²</strong>
          </div>

          <div>
            <span>PERÍMETRO</span>
            <strong>{Number(perimetro).toFixed(3)} m</strong>
          </div>

          <div>
            <span>VÉRTICES</span>
            <strong>{puntosValidos.length}</strong>
          </div>
        </section>

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>02</span>

            <div>
              <h3>Polígono General</h3>
              <p>
                Distancias y rumbos calculados del levantamiento.
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

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>03</span>

            <div>
              <h3>Datos del proyecto</h3>
              <p>
                Información que posteriormente alimentará la leyenda
                del plano.
              </p>
            </div>
          </div>

          <div className="datos-preview">
            <div>
              <span>PROYECTO</span>
              <strong>
                {datosProyecto?.nombreProyecto || '—'}
              </strong>
            </div>

            <div>
              <span>PROPIETARIO</span>
              <strong>
                {datosProyecto?.propietario || '—'}
              </strong>
            </div>

            <div>
              <span>PROVINCIA</span>
              <strong>
                {datosProyecto?.provincia || '—'}
              </strong>
            </div>

            <div>
              <span>DISTRITO</span>
              <strong>
                {datosProyecto?.distrito || '—'}
              </strong>
            </div>

            <div>
              <span>CORREGIMIENTO</span>
              <strong>
                {datosProyecto?.corregimiento || '—'}
              </strong>
            </div>

            <div>
              <span>PROFESIONAL</span>
              <strong>
                {datosProyecto?.profesional || '—'}
              </strong>
            </div>
          </div>
        </section>

        <div className="form-acciones">
          <button
            type="button"
            className="btn-secundario"
            onClick={volver}
          >
            ← Corregir levantamiento
          </button>

          <button
            type="button"
            className="btn-continuar"
          >
            Verificar plano →
          </button>
        </div>

      </main>
    </div>
  )
}

export default GenerarPlano