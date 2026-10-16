import { useEffect, useMemo, useState } from 'react'

const NUM = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v))

export default function DetalleAmarre({ coordenadasFinales = [], detalleAmarre, tramoAmarre, sistemaCoordenadas = 'local' }) {
  const [cartografia, setCartografia] = useState(null)
  const [error, setError] = useState('')
  const puntos = useMemo(() => coordenadasFinales.filter(p => NUM(p.este) && NUM(p.norte)), [coordenadasFinales])
  const referenciaValida = NUM(detalleAmarre?.este) && NUM(detalleAmarre?.norte)
  const enlace = puntos.find(p => p.nombre === detalleAmarre?.puntoEnlace)

  useEffect(() => {
    let activo = true
    setCartografia(null)
    setError('')
    if (sistemaCoordenadas !== 'utm' || !puntos.length) return
    const cargar = async () => {
      try {
        const respuesta = await fetch(`${import.meta.env.BASE_URL}cartografia/indice_sectores.json`)
        if (!respuesta.ok) throw new Error('No se pudo cargar el índice cartográfico')
        const indice = await respuesta.json()
        const sector = (indice.sectores || []).find(s => {
          const e = Number(s.este), n = Number(s.norte), r = Number(s.radio)
          return [e, n, r].every(Number.isFinite) && puntos.every(p => Math.abs(Number(p.este) - e) <= r && Math.abs(Number(p.norte) - n) <= r)
        })
        if (!sector) throw new Error('No existe cartografía para este terreno')
        const respuestaSector = await fetch(`${import.meta.env.BASE_URL}cartografia/${sector.archivo}`)
        if (!respuestaSector.ok) throw new Error('No se pudo cargar el sector cartográfico')
        const datos = await respuestaSector.json()
        if (activo) setCartografia(datos)
      } catch (e) {
        if (activo) setError(e.message)
      }
    }
    cargar()
    return () => { activo = false }
  }, [puntos, sistemaCoordenadas])

  if (sistemaCoordenadas !== 'utm') return <section className="form-seccion"><h3>DETALLE DE AMARRE</h3><p>Para mostrar la cartografía se requieren coordenadas UTM.</p></section>

  const e = puntos.map(p => Number(p.este)), n = puntos.map(p => Number(p.norte))
  if (referenciaValida) { e.push(Number(detalleAmarre.este)); n.push(Number(detalleAmarre.norte)) }
  const minE = Math.min(...e), maxE = Math.max(...e), minN = Math.min(...n), maxN = Math.max(...n)
  const centroE = (minE + maxE) / 2, centroN = (minN + maxN) / 2
  // Vista ajustada al lote y a la referencia, con margen de seguridad.
  const ladoMetros = Math.max(300, (maxE - minE) * 2.5, (maxN - minN) * 2.5)
  const origenE = centroE - ladoMetros / 2, origenN = centroN + ladoMetros / 2
  const proyectar = (este, norte) => ({ x: (Number(este) - origenE) * 800 / ladoMetros, y: (origenN - Number(norte)) * 800 / ladoMetros })
  const vertices = puntos.map(p => ({ ...proyectar(p.este, p.norte), nombre: p.nombre }))
  const ref = referenciaValida ? proyectar(detalleAmarre.este, detalleAmarre.norte) : null
  const destino = enlace ? proyectar(enlace.este, enlace.norte) : null
  const tramoValido = ref && destino && Number.isFinite(Number(tramoAmarre?.distancia)) && tramoAmarre?.distancia !== null && tramoAmarre?.distancia !== undefined
  const barraMetros = ladoMetros >= 5000 ? 500 : ladoMetros >= 2000 ? 200 : ladoMetros >= 1000 ? 100 : ladoMetros >= 500 ? 50 : 25
  const barraPorcentaje = barraMetros / ladoMetros * 100

  return (
    <section className="form-seccion" aria-label="Detalle de amarre">
      <h3>DETALLE DE AMARRE</h3>
      <p>Cartografía de referencia y enlace topográfico del área medida.</p>
      {error && <p role="alert">{error}</p>}
      {!cartografia && !error && <p>Cargando cartografía del detalle de amarre…</p>}
      {cartografia && (
        <div style={{ border: '1px solid #777', background: '#fff', padding: 8 }}>
          <svg viewBox="0 0 800 800" style={{ width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto' }} role="img" aria-label="Plano cartográfico del detalle de amarre">
            <defs><clipPath id="recorte-amarre"><rect x="0" y="0" width="800" height="800" /></clipPath></defs>
            <g clipPath="url(#recorte-amarre)">
              {(cartografia.elementos || []).filter(e => String(e.capa) === "2").map((e, i) => { const pts = (e.puntos || []).filter(p => Array.isArray(p) && NUM(p[0]) && NUM(p[1])).map(p => proyectar(p[0], p[1])); if (pts.length < 2 || !pts.some(p => p.x >= 0 && p.x <= 800 && p.y >= 0 && p.y <= 800)) return null; return <polyline key={i} points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#888" strokeWidth="1.2" /> })}
              {(cartografia.textos || []).filter(t => t.capa === 'NOMBRES DE CALLE' && NUM(t.este) && NUM(t.norte)).map((t, i) => {
                const p = proyectar(t.este, t.norte)
                return <text key={i} x={p.x} y={p.y} fontSize="9" fill="#333">{t.texto || t.text || t.contenido || ''}</text>
              })}
              {vertices.length >= 2 && (vertices.length >= 3 ? <polygon points={vertices.map(p => `${p.x},${p.y}`).join(' ')} fill="#f4c542" fillOpacity="0.3" stroke="#111" strokeWidth="2" /> : <polyline points={vertices.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#111" strokeWidth="2" />)}
              {vertices.length > 0 && <text x={vertices.reduce((s,p)=>s+p.x,0)/vertices.length} y={vertices.reduce((s,p)=>s+p.y,0)/vertices.length} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#111">ÁREA MEDIDA</text>}
              {tramoValido && <g><line x1={ref.x} y1={ref.y} x2={destino.x} y2={destino.y} stroke="#111" strokeWidth="2" strokeDasharray="8 5" /><circle cx={ref.x} cy={ref.y} r="5" fill="#111" /><text x={ref.x+9} y={ref.y-8} fontSize="12" fill="#111">{detalleAmarre.nombreReferencia || 'REFERENCIA'}</text><circle cx={destino.x} cy={destino.y} r="4" fill="#111" /><text x={(ref.x+destino.x)/2} y={(ref.y+destino.y)/2-10} textAnchor="middle" fontSize="11" fill="#111">{Number(tramoAmarre.distancia).toFixed(2)} m · {tramoAmarre.rumbo || 'Rumbo sin determinar'}</text></g>}
            </g>
          </svg>
          <div style={{ textAlign: 'center', padding: '4px 8px 8px' }}>
            <strong style={{ fontSize: 10 }}>ESCALA GRÁFICA</strong>
            <div style={{ width: `${barraPorcentaje}%`, maxWidth: 65, display: 'flex', height: 7, margin: '8px auto 3px', border: '1px solid #111', boxSizing: 'border-box' }}><div style={{ width: '50%', background: '#111' }} /><div style={{ width: '50%', background: '#fff' }} /></div>
            <span style={{ fontSize: 9 }}>0 — {barraMetros / 2} — {barraMetros} m</span>
          </div>
        </div>
      )}
      {(!referenciaValida || !enlace) && <p>Para dibujar el tramo de amarre, registra las coordenadas de la referencia y selecciona un punto de enlace en Levantamiento.</p>}
      {tramoValido && <p><strong>Referencia:</strong> {detalleAmarre.nombreReferencia || 'Sin nombre'} · <strong>Enlace:</strong> {detalleAmarre.puntoEnlace} · <strong>Distancia:</strong> {Number(tramoAmarre.distancia).toFixed(2)} m · <strong>Rumbo:</strong> {tramoAmarre.rumbo || '—'}</p>}
      {detalleAmarre?.observaciones && <p><strong>Observaciones:</strong> {detalleAmarre.observaciones}</p>}
    </section>
  )
}
