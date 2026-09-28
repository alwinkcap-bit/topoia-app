function VerificarPlano({ datosProyecto, levantamiento, volver, continuar }) {
    const cantidadVertices = levantamiento?.puntos?.length || 0
  const verticesValidos = cantidadVertices >= 3
  const coordenadasValidas =
  cantidadVertices > 0 &&
  levantamiento.puntos.every(
    (punto) =>
      punto.norte !== '' &&
      punto.este !== '' &&
      Number.isFinite(Number(punto.norte)) &&
      Number.isFinite(Number(punto.este))
  )
    const requiereControlCierre =
    levantamiento?.tipoLevantamiento === 'cerrado' &&
    levantamiento?.metodoEntrada === 'rumbos'

 const cierreDisponible =
  !requiereControlCierre ||
  levantamiento?.errorCierre != null

const cierreAceptable =
  !requiereControlCierre ||
  (
    cierreDisponible &&
    (
      !Number.isFinite(levantamiento.errorCierre.precision) ||
      levantamiento.errorCierre.precision >= 1000
    )
  )

const planoListo =
  verticesValidos &&
  coordenadasValidas &&
  cierreDisponible &&
  cierreAceptable

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
<section className="form-seccion">
  <div className="form-seccion-titulo">
    <span>03</span>

    <div>
      <h3>Verificación automática</h3>
      <p>
        Comprobaciones técnicas antes de generar el documento final.
      </p>
    </div>
  </div>

  <div className="datos-preview">
    <div>
      <span>VÉRTICES DEL LEVANTAMIENTO</span>
      <strong>
        {verticesValidos
          ? `✓ Correcto (${cantidadVertices})`
          : `⚠ Se requieren mínimo 3 (${cantidadVertices})`}
      </strong>
    </div>
       <div>
      <span>COORDENADAS</span>
      <strong>
        {coordenadasValidas
          ? '✓ Coordenadas válidas'
          : '⚠ Revisar coordenadas'}
      </strong>
    </div> 
   {requiereControlCierre && (
  <div>
    <span>CONTROL DE CIERRE</span>
    <strong>
      {!cierreDisponible
        ? '⚠ Revisar datos de cierre'
        : !cierreAceptable
          ? `⚠ Cierre fuera del nivel configurado · Precisión 1:${Math.round(
              levantamiento.errorCierre.precision
            )} · Mínimo 1:1000`
          : Number.isFinite(levantamiento.errorCierre.precision)
            ? `✓ Error: ${levantamiento.errorCierre.errorLineal.toFixed(
                3
              )} m · Precisión 1:${Math.round(
                levantamiento.errorCierre.precision
              )}`
            : '✓ Cierre exacto'}
    </strong>
  </div>
)}
<div className="datos-preview">
  <div>
    <span>ESTADO GENERAL</span>
    <strong>
      {planoListo
        ? '✓ Plano listo para generar documento final'
        : '⚠ El plano requiere correcciones'}
    </strong>
  </div>
</div>
  </div>
</section>

{planoListo && (
  <div className="form-acciones">
    <button
      type="button"
      className="btn-continuar"
      onClick={continuar}
    >
      Generar documento final →
    </button>
  </div>
)}
      </main>
    </div>
  )
}

export default VerificarPlano