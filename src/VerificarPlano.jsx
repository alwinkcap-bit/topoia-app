function VerificarPlano({ datosProyecto, levantamiento, volver }) {

  return (
    <div className="nuevo-plano">
      <div className="nuevo-header">
        <button
          type="button"
          className="btn-volver"
          onClick={volver}
        >
          ← Generar plano
        </button>

        <div>
          <span className="paso-label">NUEVO PLANO</span>
          <h2>Verificación del plano</h2>
          <p>
            Revisión final de los datos antes de generar el documento.
          </p>
        </div>

        <div className="paso-indicador">
          <strong>04</strong>
          <span>de 04</span>
        </div>
      </div>

      <div className="progreso">
        <div
          className="progreso-activo"
          style={{ width: '100%' }}
        />
      </div>

      <main className="form-plano">
       <section className="form-seccion">
  <div className="form-seccion-titulo">
    <span>01</span>

    <div>
      <h3>Datos del proyecto</h3>
      <p>
        Verifique la información general antes de generar el documento.
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
      <span>PROVINCIA</span>
      <strong>{datosProyecto?.provincia || '—'}</strong>
    </div>

    <div>
      <span>DISTRITO</span>
      <strong>{datosProyecto?.distrito || '—'}</strong>
    </div>

    <div>
      <span>CORREGIMIENTO</span>
      <strong>{datosProyecto?.corregimiento || '—'}</strong>
    </div>

    <div>
      <span>PROFESIONAL</span>
      <strong>{datosProyecto?.profesional || '—'}</strong>
    </div>
  </div>
</section>
<section className="form-seccion">
  <div className="form-seccion-titulo">
    <span>02</span>

    <div>
      <h3>Datos del levantamiento</h3>
      <p>
        Resumen de la información utilizada para generar el plano.
      </p>
    </div>
  </div>

  <div className="datos-preview">
    <div>
      <span>MÉTODO</span>
      <strong>
        {levantamiento?.metodoEntrada === 'rumbos'
          ? 'Rumbos y distancias'
          : 'Coordenadas N/E'}
      </strong>
    </div>

    <div>
      <span>TIPO</span>
      <strong>
        {levantamiento?.tipoLevantamiento === 'abierto'
          ? 'Recorrido abierto'
          : 'Polígono cerrado'}
      </strong>
    </div>

    <div>
      <span>VÉRTICES</span>
      <strong>{levantamiento?.puntos?.length || 0}</strong>
    </div>

    <div>
      <span>ÁREA</span>
      <strong>
        {levantamiento?.area != null
          ? `${Number(levantamiento.area).toFixed(3)} m²`
          : '—'}
      </strong>
    </div>

    <div>
      <span>PERÍMETRO / LONGITUD</span>
     <strong>
  {levantamiento?.metodoEntrada === 'rumbos' &&
  levantamiento?.longitudObservada != null
    ? `${Number(levantamiento.longitudObservada).toFixed(3)} m`
    : levantamiento?.perimetro != null
      ? `${Number(levantamiento.perimetro).toFixed(3)} m`
      : '—'}
</strong>
    </div>
  </div>
</section>
      </main>
    </div>
  )
}

export default VerificarPlano