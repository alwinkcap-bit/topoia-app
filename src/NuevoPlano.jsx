import { useEffect, useState } from 'react'

function NuevoPlano({ volver, continuar }) {
  const datosGuardados = (() => {
    try {
      const datos = localStorage.getItem('topoia-nuevo-plano')
      return datos ? JSON.parse(datos) : null
    } catch {
      return null
    }
  })()

  const [datos, setDatos] = useState(datosGuardados || {
    nombreProyecto: '',
    provincia: '',
    distrito: '',
    corregimiento: '',
    localidad: '',
    propietario: '',
    cedulaPropietario: '',
    numeroPredio: '',
    cedulaCatastral: '',
    proposito: '',
    adquiriente: '',
    cedulaAdquiriente: '',
    profesional: '',
    idoneidad: '',
    fechaLevantamiento: '',
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

    setDatos((anterior) => ({
      ...anterior,
      [name]: value,
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

      <form className="form-plano" onSubmit={continuar}>

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
                value={datos.provincia}
                onChange={actualizar}
                placeholder="Provincia"
                required
              />
            </label>

            <label className="campo">
              Distrito
              <input
                name="distrito"
                value={datos.distrito}
                onChange={actualizar}
                placeholder="Distrito"
                required
              />
            </label>

            <label className="campo">
              Corregimiento
              <input
                name="corregimiento"
                value={datos.corregimiento}
                onChange={actualizar}
                placeholder="Corregimiento"
                required
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
              Cédula / identificación
              <input
                name="cedulaPropietario"
                value={datos.cedulaPropietario}
                onChange={actualizar}
                placeholder="Identificación"
              />
            </label>

            <label className="campo">
              N.º de predio
              <input
                name="numeroPredio"
                value={datos.numeroPredio}
                onChange={actualizar}
                placeholder="Número de predio"
              />
            </label>

            <label className="campo campo-completo">
              N.º de cédula catastral
              <input
                name="cedulaCatastral"
                value={datos.cedulaCatastral}
                onChange={actualizar}
                placeholder="Cédula catastral"
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