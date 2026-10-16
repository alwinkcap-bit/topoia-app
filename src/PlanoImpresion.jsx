import './PlanoImpresion.css'
import { useState } from 'react'
import LocalizacionRegional from './LocalizacionRegional'
import DetalleAmarre from './DetalleAmarre'

export default function PlanoImpresion({
  datosProyecto,
  levantamiento,
  coordenadasFinales = [],
  ubicacionGeografica,
}) {
  const [escalaManual, setEscalaManual] = useState('auto')
  const escalas = [250, 500, 1000, 2000, 5000]

  const puntosValidos = coordenadasFinales.filter(
    p => Number.isFinite(Number(p.este)) &&
         Number.isFinite(Number(p.norte)) &&
         p.este !== '' && p.norte !== ''
  )

  const estes = puntosValidos.map(p => Number(p.este))
  const nortes = puntosValidos.map(p => Number(p.norte))

  const anchoTerreno = estes.length
    ? Math.max(...estes) - Math.min(...estes)
    : 0

  const altoTerreno = nortes.length
    ? Math.max(...nortes) - Math.min(...nortes)
    : 0

  const escalaAutomatica = escalas.find(
    escala =>
      anchoTerreno * 1000 / escala <= 220 &&
      altoTerreno * 1000 / escala <= 160
  ) || escalas[escalas.length - 1]

  const escalaSeleccionada = escalaManual === 'auto'
    ? escalaAutomatica
    : Number(escalaManual)

  const anchoDibujo = 260
  const altoDibujo = 200

  const minEste = estes.length ? Math.min(...estes) : 0
  const minNorte = nortes.length ? Math.min(...nortes) : 0

  const metrosAMilimetros = 1000 / escalaSeleccionada

  const anchoPoligono = anchoTerreno * metrosAMilimetros
  const altoPoligono = altoTerreno * metrosAMilimetros

  const offsetX = (anchoDibujo - anchoPoligono) / 2
  const offsetY = (altoDibujo - altoPoligono) / 2

  const puntosDibujo = puntosValidos.map(p => ({
    ...p,
    x: offsetX + (Number(p.este) - minEste) * metrosAMilimetros,
    y: altoDibujo - offsetY -
       (Number(p.norte) - minNorte) * metrosAMilimetros
  }))

  console.table(
    puntosDibujo.map(p => ({
      nombre: p.nombre,
      este: p.este,
      norte: p.norte,
      x: p.x,
      y: p.y
    }))
  )

  const sistema = levantamiento?.sistemaCoordenadas || 'local'

  return (
    <div className="topoia-hoja">
      <div className="topoia-poligono">
        <p>Escala 1:{escalaSeleccionada}</p>

        <svg
          viewBox="0 0 260 200"
          style={{
            width: '260mm',
            height: '200mm',
            maxWidth: '100%',
            background: '#fff'
          }}
        >
          {puntosDibujo.length >= 3 && (
            <polygon
              points={puntosDibujo.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#000"
              strokeWidth="0.5"
            />
          )}
{(levantamiento?.segmentos || []).map((seg, i) => {
  const inicio = puntosDibujo.find(p => p.nombre === seg.desde)
  const fin = puntosDibujo.find(p => p.nombre === seg.hasta)

  if (!inicio || !fin) return null

  const dx = fin.x - inicio.x
  const dy = fin.y - inicio.y
  const longitud = Math.hypot(dx, dy)

  if (longitud === 0) return null

  const centroX = (inicio.x + fin.x) / 2
  const centroY = (inicio.y + fin.y) / 2

  // Desplazamiento perpendicular al lado del terreno
  const desplazamiento = 7
  const x = centroX - (dy / longitud) * desplazamiento
  const y = centroY + (dx / longitud) * desplazamiento

  const distancia = Number(seg.distancia)
  const textoDistancia =
    seg.distancia != null &&
    seg.distancia !== '' &&
    Number.isFinite(distancia)
      ? `${distancia.toFixed(2)} m`
      : '—'

  return (
    <g key={`medida-${i}`}>
      <text
        x={x}
        y={y - 2}
        fontSize="4.5"
        fontWeight="bold"
        textAnchor="middle"
        fill="#000"
      >
        {textoDistancia}
      </text>

      <text
        x={x}
        y={y + 2}
        fontSize="3.5"
        textAnchor="middle"
        fill="#000"
      >
        {seg.rumbo || '—'}
      </text>
    </g>
  )
})}
          {puntosDibujo.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="1.2" fill="#000" />
              <text
                x={p.x + 2}
                y={p.y - 2}
                fontSize="3"
                fill="#000"
              >
                {p.nombre}
              </text>
            </g>
          ))}
        </svg>
        <div className="topoia-escala-poligono">
          <strong>ESCALA GRÁFICA — 1:{escalaSeleccionada}</strong>
          <svg viewBox="0 0 300 45" width="300">
            {[0, 1, 2, 3].map(i => (
              <rect key={i} x={20 + i * 60} y="5"
                width="60" height="14"
                fill={i % 2 === 0 ? '#111' : '#fff'}
                stroke="#111" strokeWidth="1" />
            ))}
            {[0, 1, 2, 3, 4].map(i => (
              <text key={i} x={20 + i * 60} y="36"
                fontSize="12" textAnchor="middle" fill="#111">
                {i * escalaSeleccionada * 0.01}
              </text>
            ))}
            <text x="280" y="36" fontSize="12" fill="#111">m</text>
          </svg>
        </div>
      </div>

      <div className="topoia-columna-datos">
      <div className="topoia-datos-campo">
        <h3>DATOS DE CAMPO</h3>
        <table>
          <thead>
            <tr>
              <th>EST.</th>
              <th>P.V.</th>
              <th>RUMBO</th>
              <th>DIST. (m)</th>
              <th>NORTE</th>
              <th>ESTE</th>
            </tr>
          </thead>
          <tbody>
            {(levantamiento?.segmentos || []).map((seg, i) => {
              const punto = coordenadasFinales.find(
                p => p.nombre === seg.hasta
              )
              return (
                <tr key={i}>
                  <td>{seg.desde}</td>
                  <td>{seg.hasta}</td>
                  <td>{seg.rumbo || '—'}</td>
                  <td>{Number.isFinite(Number(seg.distancia)) && seg.distancia != null
                    ? Number(seg.distancia).toFixed(2)
                    : '—'}</td>
                  <td>{punto ? Number(punto.norte).toFixed(4) : '—'}</td>
                  <td>{punto ? Number(punto.este).toFixed(4) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>


      <section className="topoia-cuadro-pi">
        <h3>PUNTOS DE INTERÉS (PI)</h3>
        <table>
          <thead><tr><th>PUNTO</th><th>NORTE</th><th>ESTE</th></tr></thead>
          <tbody>
            {['pi1', 'pi2'].map((id, i) => {
              const p = levantamiento?.puntosPI?.[id]
              if (!p || p.norte === '' || p.este === '' ||
                  !Number.isFinite(Number(p.norte)) ||
                  !Number.isFinite(Number(p.este))) return null
              return <tr key={id}>
                <td>PI-{i + 1}</td>
                <td>{Number(p.norte).toFixed(3)}</td>
                <td>{Number(p.este).toFixed(3)}</td>
              </tr>
            })}
          </tbody>
        </table>
      </section>
      </div>

      <footer className="topoia-pie-plano">
        <section className="pie-aprobaciones">
          <h4>APROBACIONES Y SELLOS</h4>
          <div className="pie-espacio-sello"></div>
          <p>Espacio reservado para revisión y aprobación</p>
        </section>

        <section className="pie-firmas">
          <h4>FIRMAS DE INTERESADOS</h4>
          <div className="pie-linea-firma">PROPIETARIO: {datosProyecto?.propietario || '—'}</div>
          <div className="pie-linea-firma">OTROS INTERESADOS</div>
        </section>

        <section className="pie-informacion pie-cajetin-tecnico">
          <h4>REPÚBLICA DE PANAMÁ</h4>

          <div className="cajetin-ubicacion">
            <div>
              <p><b>PROVINCIA:</b> {datosProyecto?.provincia || '—'}</p>
              <p><b>DISTRITO:</b> {datosProyecto?.distrito || '—'}</p>
            </div>
            <div>
              <p><b>CORREGIMIENTO:</b> {datosProyecto?.corregimiento || '—'}</p>
              <p><b>LUGAR:</b> {datosProyecto?.localidad || '—'}</p>
            </div>
          </div>

          <div className="cajetin-descripcion">
            <p><b>PROPIETARIO:</b> {datosProyecto?.propietario || '—'}</p>
            <p><b>FOLIO REAL:</b> {datosProyecto?.folioReal || '—'}</p>
            <p><b>PREDIO:</b> {datosProyecto?.numeroPredio || '—'}</p>
          </div>

          <div className="cajetin-parte-inferior">
            <div className="cajetin-columna-izquierda">
<div className="cajetin-area">
            ÁREA: {Number(
              levantamiento?.areaAjustada ?? levantamiento?.area ?? 0
            ).toFixed(2)} m²
          </div>
<div className="cajetin-profesional">
              <b>TÉCNICO TOPÓGRAFO</b>
              <span>{datosProyecto?.profesional || '—'}</span>
              <b>LICENCIA / IDONEIDAD</b>
              <span>{datosProyecto?.idoneidad || '—'}</span>
              <p><b>ESCALA:</b> 1:{escalaSeleccionada}</p>
              <p><b>FECHA:</b> {datosProyecto?.fechaLevantamiento || '—'}</p>
            </div>

            </div>

            <div className="cajetin-firma">
              <b>FIRMA Y SELLO</b>
              <div className="cajetin-espacio-firma"></div>
              <span>FIRMA DEL PROFESIONAL</span>
            </div>
          </div>
        </section>
      </footer>

      <div className="topoia-lateral">
        <LocalizacionRegional
          ubicacionGeografica={ubicacionGeografica}
          datosProyecto={datosProyecto}
          coordenadasFinales={coordenadasFinales}
          sistemaCoordenadas={sistema}
        />

        <DetalleAmarre
          coordenadasFinales={coordenadasFinales}
          detalleAmarre={levantamiento?.detalleAmarre}
          tramoAmarre={levantamiento?.tramoAmarre}
          sistemaCoordenadas={sistema}
        />
      </div>
    </div>
  )
}
