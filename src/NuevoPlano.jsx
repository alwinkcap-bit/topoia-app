import { useEffect, useState } from 'react'

const ubicacionesHerrera = {
  'Chitré': {
    'Chitré': '60101',
    'Las Arenas': '60102',
    'Monagrillo': '60103',
    'Llano Bonito': '60104',
    'San Juan Bautista': '60105',
  },
  'Las Minas': {
    'Las Minas': '60201',
    'Chepo': '60202',
    'El Chumical': '60203',
    'El Toro': '60204',
    'Leones': '60205',
    'Quebrada del Rosario': '60206',
  },
  'Los Pozos': {
    'Los Pozos': '60301',
    'El Capurí': '60302',
    'El Calabacito': '60303',
    'El Cedro': '60304',
    'La Arena': '60305',
    'La Pitaloza': '60306',
    'Los Cerritos': '60307',
    'Cerro Paja': '60308',
    'Las Llanas': '60309',
  },
  'Ocú': {
    'Ocú': '60401',
    'Cerro Largo': '60402',
    'Los Llanos': '60403',
    'Llano Grande': '60404',
    'Peña Chatas': '60405',
    'Tijera': '60406',
    'Menchaca': '60407',
    'Entradero del Castillo': '60408',
  },
  'Parita': {
    'Parita': '60501',
    'Cabuya': '60502',
    'Los Castillos': '60503',
    'Llano de la Cruz': '60504',
    'París': '60505',
    'Portobelillo': '60506',
    'Rincón Hondo': '60507',
  },
  'Pesé': {
    'Pesé': '60601',
    'Las Cabras': '60602',
    'El Pájaro': '60603',
    'El Barrero': '60604',
    'El Pedregoso': '60605',
    'El Ciruelo': '60606',
    'Sabana Grande': '60607',
    'Rincón Hondo': '60608',
  },
  'Santa María': {
    'Santa María': '60701',
    'Chupampa': '60702',
    'El Rincón': '60703',
    'El Limón': '60704',
    'Los Canelos': '60705',
  },
}

function NuevoPlano({ volver, continuar }) {
  const datosGuardados = (() => {
    try {
      const datos = localStorage.getItem('topoia-nuevo-plano')
      return datos ? JSON.parse(datos) : null
    } catch {
      return null
    }
  })()

  const [datos, setDatos] = useState({
    nombreProyecto: '',
    tipoPlano: '',
    provincia: '',
    distrito: '',
    corregimiento: '',
    codigoUbicacion: '',
    localidad: '',
    propietario: '',
    cedulaPropietario: '',
    folioReal: '',
    areaFolioReal: '',
    numeroPredio: '',
    cedulaCatastral: '',
    documentoRegistral: '',
    descripcionCajetin: '',
    proposito: '',
    adquiriente: '',
    cedulaAdquiriente: '',
    firmasAdicionales: [],
    adquirientesAdicionales: [],
    profesional: '',
    idoneidad: '',
    fechaLevantamiento: '',
    ...(datosGuardados || {}),
  })

  useEffect(() => {
    try {
      localStorage.setItem(
        'topoia-nuevo-plano',
        JSON.stringify(datos)
      )
    } catch {
      // Si localStorage no está disponible, la app continúa normalmente.
    }
  }, [datos])

  const actualizar = (e) => {
    const { name, value } = e.target

    setDatos((anterior) => {
      if (name === 'distrito') {
        return {
          ...anterior,
          provincia: 'Herrera',
          distrito: value,
          corregimiento: '',
          codigoUbicacion: '',
        }
      }

      if (name === 'corregimiento') {
        return {
          ...anterior,
          provincia: 'Herrera',
          corregimiento: value,
          codigoUbicacion:
            ubicacionesHerrera[anterior.distrito]?.[value] || '',
        }
      }

      return {
        ...anterior,
        [name]: value,
      }
    })
  }


  const generarLeyenda = () => {
    const tipo = datos.tipoPlano
    const propietario = datos.propietario?.trim()
    const adquiriente = datos.adquiriente?.trim()

    const encabezados = {
      general: 'LOTE DE TERRENO',
      segregacion: 'LOTE DE TERRENO QUE SERÁ SEGREGADO',
      'medidas-linderos': 'LOTE DE TERRENO OBJETO DE MEDIDAS Y LINDEROS',
      'ley-37': 'LOTE DE TERRENO OBJETO DEL TRÁMITE LEY 37',
      lotificacion: 'TERRENO OBJETO DE LOTIFICACIÓN',
    }

    const partes = [encabezados[tipo] || 'LOTE DE TERRENO']

    if (datos.folioReal) {
      partes.push(`DEL FOLIO REAL N.º ${datos.folioReal}`)
    }

    if (datos.documentoRegistral) {
      partes.push(`DOCUMENTO N.º ${datos.documentoRegistral}`)
    }

    if (datos.codigoUbicacion) {
      partes.push(`CÓDIGO DE UBICACIÓN N.º ${datos.codigoUbicacion}`)
    }

    if (propietario) {
      partes.push(`PROPIEDAD DE: ${propietario.toUpperCase()}`)
    }

    if (datos.cedulaPropietario) {
      partes.push(`CÉDULA N.º ${datos.cedulaPropietario}`)
    }

    let texto = partes.join(', ') + '.'

    if (adquiriente) {
      texto += `\\nSERÁ ADQUIRIDO POR:\\n${adquiriente.toUpperCase()}`

      if (datos.cedulaAdquiriente) {
        texto += ` — CÉDULA N.º ${datos.cedulaAdquiriente}`
      }
    }

    setDatos(anterior => ({
      ...anterior,
      descripcionCajetin: texto,
    }))
  }


  const agregarAdquiriente = () => {
    setDatos(anterior => ({
      ...anterior,
      adquirientesAdicionales: [
        ...(anterior.adquirientesAdicionales || []),
        { nombre: '', cedula: '' }
      ]
    }))
  }

  const actualizarAdquiriente = (indice, campo, valor) => {
    setDatos(anterior => ({
      ...anterior,
      adquirientesAdicionales:
        (anterior.adquirientesAdicionales || []).map(
          (persona, i) =>
            i === indice
              ? { ...persona, [campo]: valor }
              : persona
        )
    }))
  }

  const eliminarAdquiriente = (indice) => {
    setDatos(anterior => ({
      ...anterior,
      adquirientesAdicionales:
        (anterior.adquirientesAdicionales || []).filter(
          (_, i) => i !== indice
        )
    }))
  }

  const enviarFormulario = (e) => {
  e.preventDefault()

  if (continuar) {
    continuar(datos)
  }
}

  return (
    <div className="nuevo-plano">
      <div className="nuevo-header">
        <button
          type="button"
          className="btn-volver"
          onClick={volver}
        >
          ← Volver
        </button>

        <div>
          <span className="paso-label">NUEVO PLANO</span>
          <h2>Datos del predio</h2>
          <p>
            Información general para la preparación del plano topográfico.
          </p>
        </div>

        <div className="paso-indicador">
          <strong>01</strong>
          <span>de 04</span>
        </div>
      </div>

      <div className="progreso">
        <div className="progreso-activo"></div>
      </div>

      <form className="form-plano" onSubmit={enviarFormulario}>

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>LG</span>
            <div>
              <h3>Leyenda técnica del plano</h3>
              <p>Genera y corrige la descripción del cajetín.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="campo">
              Número de documento registral
              <input
                name="documentoRegistral"
                value={datos.documentoRegistral || ''}
                onChange={actualizar}
                placeholder="Ej. 890421"
              />
            </label>

            <div className="campo campo-completo">
              <button type="button" onClick={generarLeyenda}>
                Generar leyenda automáticamente
              </button>
            </div>

            <label className="campo campo-completo">
              Leyenda editable
              <textarea
                name="descripcionCajetin"
                value={datos.descripcionCajetin || ''}
                onChange={actualizar}
                rows={7}
                placeholder="Genera la leyenda y corrige su redacción aquí."
              />
            </label>
          </div>
        </section>





        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>01</span>
            <div>
              <h3>Proyecto</h3>
              <p>Identificación inicial del trabajo.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="campo campo-completo">
              Nombre del proyecto
              <input
                name="nombreProyecto"
                value={datos.nombreProyecto}
                onChange={actualizar}
                placeholder="Ej. Segregación de terreno"
                required
              />
            </label>
            <label className="campo">
  Tipo de plano
  <select
    name="tipoPlano"
    value={datos.tipoPlano}
    onChange={actualizar}
    required
  >
    <option value="">Seleccione...</option>
    <option value="general">Plano general</option>
    <option value="segregacion">Segregación</option>
    <option value="medidas-linderos">Medidas y linderos</option>
    <option value="ley-37">Ley 37</option>
    <option value="lotificacion">Lotificación</option>
  </select>
</label>

            <label className="campo">
              Propósito del plano
              <select
                name="proposito"
                value={datos.proposito}
                onChange={actualizar}
                required
              >
                <option value="">Seleccionar</option>
                <option value="segregacion">Segregación</option>
                <option value="lotificacion">Lotificación</option>
                <option value="adjudicacion">Adjudicación</option>
                <option value="mensura">Mensura</option>
                <option value="otro">Otro</option>
              </select>
            </label>

            <label className="campo">
              Fecha del levantamiento
              <input
                type="date"
                name="fechaLevantamiento"
                value={datos.fechaLevantamiento}
                onChange={actualizar}
              />
            </label>
          </div>
        </section>

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>02</span>
            <div>
              <h3>Localización</h3>
              <p>Ubicación administrativa del predio.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="campo">
              Provincia
              <input
                name="provincia"
                value="Herrera"
                readOnly
              />
            </label>

            <label className="campo">
              Distrito
              <select
                name="distrito"
                value={datos.distrito}
                onChange={actualizar}
                required
              >
                <option value="">Seleccione un distrito</option>
                {Object.keys(ubicacionesHerrera).map((distrito) => (
                  <option key={distrito} value={distrito}>
                    {distrito}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              Corregimiento
              <select
                name="corregimiento"
                value={datos.corregimiento}
                onChange={actualizar}
                disabled={!datos.distrito}
                required
              >
                <option value="">Seleccione un corregimiento</option>
                {datos.distrito &&
                  Object.keys(
                    ubicacionesHerrera[datos.distrito] || {}
                  ).map((corregimiento) => (
                    <option key={corregimiento} value={corregimiento}>
                      {corregimiento}
                    </option>
                  ))}
              </select>
            </label>

            <label className="campo">
              Código de ubicación
              <input
                name="codigoUbicacion"
                value={datos.codigoUbicacion}
                readOnly
                placeholder="Automático"
              />
            </label>

            <label className="campo">
              Lugar / Localidad
              <input
                name="localidad"
                value={datos.localidad}
                onChange={actualizar}
                placeholder="Lugar o localidad"
                required
              />
            </label>
          </div>
        </section>

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>03</span>
            <div>
              <h3>Predio y propietario</h3>
              <p>Información registral y del propietario.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="campo campo-completo">
              Nombre del propietario
              <input
                name="propietario"
                value={datos.propietario}
                onChange={actualizar}
                placeholder="Nombre completo"
                required
              />
            </label>

            <label className="campo">
  Folio Real
  <input
    name="folioReal"
    value={datos.folioReal}
    onChange={actualizar}
    placeholder="Número de Folio Real"
  />
</label>
<label className="campo">
  Área del Folio Real (m²)
  <input
    type="number"
    name="areaFolioReal"
    value={datos.areaFolioReal}
    onChange={actualizar}
    placeholder="Ej. 2500.00"
    min="0"
    step="0.01"
  />
</label>
            <label className="campo">
              Cédula / identificación
              <input
                name="cedulaPropietario"
                value={datos.cedulaPropietario}
                onChange={actualizar}
                placeholder="Identificación"
              />
            </label>
          </div>
        </section>

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>04</span>
            <div>
              <h3>Adquiriente</h3>
              <p>Completar cuando corresponda al trámite.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="campo">
              Nombre del adquiriente
              <input
                name="adquiriente"
                value={datos.adquiriente}
                onChange={actualizar}
                placeholder="Nombre completo"
              />
            </label>

            <label className="campo">
              Cédula / identificación
              <input
                name="cedulaAdquiriente"
                value={datos.cedulaAdquiriente}
                onChange={actualizar}
                placeholder="Identificación"
              />
            </label>
          </div>

          <div style={{ marginTop: '18px' }}>
            {(datos.adquirientesAdicionales || []).map(
              (persona, indice) => (
                <div
                  key={indice}
                  className="form-grid"
                  style={{
                    marginBottom: '16px',
                    padding: '14px',
                    border: '1px solid #d5e0e3',
                    borderRadius: '10px'
                  }}
                >
                  <label className="campo">
                    Nombre del adquiriente {indice + 2}
                    <input
                      value={persona.nombre || ''}
                      onChange={e =>
                        actualizarAdquiriente(
                          indice, 'nombre', e.target.value
                        )
                      }
                      placeholder="Nombre completo"
                    />
                  </label>

                  <label className="campo">
                    Cédula / identificación
                    <input
                      value={persona.cedula || ''}
                      onChange={e =>
                        actualizarAdquiriente(
                          indice, 'cedula', e.target.value
                        )
                      }
                      placeholder="Identificación"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => eliminarAdquiriente(indice)}
                  >
                    Eliminar adquiriente
                  </button>
                </div>
              )
            )}

            <button
              type="button"
              onClick={agregarAdquiriente}
            >
              + Agregar adquiriente
            </button>
          </div>
        </section>

        <section className="form-seccion">
          <div className="form-seccion-titulo">
            <span>05</span>
            <div>
              <h3>Profesional responsable</h3>
              <p>Información del profesional responsable del levantamiento.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="campo">
              Profesional responsable
              <input
                name="profesional"
                value={datos.profesional}
                onChange={actualizar}
                placeholder="Nombre del profesional"
                required
              />
            </label>

            <label className="campo">
              N.º de idoneidad
              <input
                name="idoneidad"
                value={datos.idoneidad}
                onChange={actualizar}
                placeholder="Número de idoneidad"
                required
              />
            </label>
          </div>
        </section>

        <div className="form-acciones">
          <button
            type="button"
            className="btn-secundario"
            onClick={volver}
          >
            Cancelar
          </button>

          <button type="submit" className="btn-continuar">
            Continuar al levantamiento →
          </button>
        </div>

      </form>
    </div>
  )
}

export default NuevoPlano