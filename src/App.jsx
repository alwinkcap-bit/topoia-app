import { useRef, useState } from 'react'
import './App.css'
import NuevoPlano from './NuevoPlano'
import Levantamiento from './Levantamiento'
import GenerarPlano from './GenerarPlano'
import VerificarPlano from './VerificarPlano'
import DocumentoFinal from './DocumentoFinal'
import VistaCAD from './VistaCAD'

function App() {
  const selectorProyectoRef = useRef(null)

  const abrirProyecto = (evento) => {
    const archivo = evento.target.files?.[0]
    if (!archivo) return

    const lector = new FileReader()

    lector.onload = () => {
      try {
        const proyecto = JSON.parse(lector.result)

        if (
          proyecto?.aplicacion !== 'TopoIA' ||
          !proyecto?.datosProyecto ||
          !proyecto?.datosLevantamiento
        ) {
          alert('El archivo seleccionado no es un proyecto válido de TopoIA.')
          return
        }

        localStorage.setItem(
          'topoia-nuevo-plano',
          JSON.stringify(proyecto.datosProyecto)
        )

        localStorage.setItem(
          'topoia-levantamiento',
          JSON.stringify(proyecto.datosLevantamiento)
        )

        setDatosProyecto(proyecto.datosProyecto)
        setDatosLevantamiento(proyecto.datosLevantamiento)
        setPantalla('inicio')

        alert('Proyecto TopoIA restaurado correctamente.')
      } catch (error) {
        console.error('Error al abrir proyecto:', error)
        alert('No se pudo abrir el proyecto.')
      } finally {
        evento.target.value = ''
      }
    }

    lector.readAsText(archivo)
  }

  const guardarProyecto = () => {
    try {
      const proyecto = {
        version: 1,
        aplicacion: 'TopoIA',
        fechaGuardado: new Date().toISOString(),
        datosProyecto,
        datosLevantamiento,
      }

      const contenido = JSON.stringify(proyecto, null, 2)
      const blob = new Blob([contenido], {
        type: 'application/json',
      })

      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')

      const nombreBase =
        datosProyecto?.nombreProyecto
          ?.trim()
          .replace(/[^a-zA-Z0-9_-]+/g, '_') ||
        'proyecto-topoia'

      enlace.href = url
      enlace.download = `${nombreBase}.topoia.json`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al guardar proyecto:', error)
    }
  }

    const [pantalla, setPantalla] = useState('inicio')
    const [datosProyecto, setDatosProyecto] = useState(() => {
  try {
    const datos = localStorage.getItem('topoia-nuevo-plano')
    return datos ? JSON.parse(datos) : null
  } catch {
    return null
  }
})
    const [datosLevantamiento, setDatosLevantamiento] = useState(() => {
  try {
    const datos = localStorage.getItem('topoia-levantamiento')
    return datos ? JSON.parse(datos) : null
  } catch {
    return null
  }
})

if (pantalla === 'nuevo-plano') {
  return (
    <NuevoPlano
      volver={() => setPantalla('inicio')}
      continuar={(datos) => {
        setDatosProyecto(datos)
        setPantalla('levantamiento')
      }}
    />
  )
}

if (pantalla === 'levantamiento') {
  return (
    <Levantamiento
      volver={() => setPantalla('nuevo-plano')}
      continuar={(levantamiento) => {
        setDatosLevantamiento(levantamiento)
        setPantalla('generar-plano')
      }}
    />
  )
}

if (pantalla === 'generar-plano') {
  return (
    <GenerarPlano
      datosProyecto={datosProyecto}
      levantamiento={datosLevantamiento}
      volver={() => setPantalla('levantamiento')}
      continuar={() => setPantalla('verificar-plano')}
    />
  )
}

if (pantalla === 'verificar-plano') {
  return (
  <VerificarPlano
  datosProyecto={datosProyecto}
  levantamiento={datosLevantamiento}
  volver={() => setPantalla('generar-plano')}
  continuar={() => setPantalla('documento-final')}
/>
  )
}
if (pantalla === 'documento-final') {
  return (
    <DocumentoFinal
      datosProyecto={datosProyecto}
      levantamiento={datosLevantamiento}
      volver={() => setPantalla('verificar-plano')}
      verCAD={() => setPantalla('vista-cad')}
    />
  )
}

if (pantalla === 'vista-cad') {
  return (
    <VistaCAD
      datosProyecto={datosProyecto}
      levantamiento={datosLevantamiento}
      volver={() => setPantalla('documento-final')}
    />
  )
}
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">T</div>

          <div>
            <h1>TopoIA</h1>
            <p>Topografía inteligente</p>
          </div>
        </div>

        <div className="status">
          <span></span>
          Sistema activo
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <p className="eyebrow">PLATAFORMA TOPOGRÁFICA</p>

          <h2>
            Planos topográficos
            <br />
            asistidos por <strong>IA</strong>
          </h2>

          <p className="hero-text">
            Crea, calcula y verifica planos topográficos mediante
            herramientas inteligentes y validaciones técnicas.
          </p>
        </section>

        <section className="actions">
          <button
  className="action-card primary"
  onClick={() => setPantalla('nuevo-plano')}
>
            <div className="action-icon">＋</div>
            <div>
              <h3>Nuevo Plano</h3>
              <p>Crear un nuevo proyecto topográfico</p>
            </div>
            <span className="arrow">→</span>
          </button>

          <button className="action-card">
            <div className="action-icon">↑</div>
            <div>
              <h3>Importar Levantamiento</h3>
              <p>Cargar coordenadas y datos de campo</p>
            </div>
            <span className="arrow">→</span>
          </button>

          <button className="action-card">
            <div className="action-icon">▱</div>
            <div>
              <h3>Mis Planos</h3>
              <p>Consultar proyectos guardados</p>
            </div>
            <span className="arrow">→</span>
          </button>

          <input
            ref={selectorProyectoRef}
            type="file"
            accept=".json,.topoia.json"
            onChange={abrirProyecto}
            style={{ display: 'none' }}
          />

          <button
            className="action-card"
            onClick={() => selectorProyectoRef.current?.click()}
          >
            <div className="action-icon">↥</div>
            <div>
              <h3>Abrir Proyecto</h3>
              <p>Restaurar un respaldo de TopoIA</p>
            </div>
            <span className="arrow">→</span>
          </button>

          <button
            className="action-card"
            onClick={guardarProyecto}
          >
            <div className="action-icon">↓</div>
            <div>
              <h3>Guardar Proyecto</h3>
              <p>Descargar respaldo completo de TopoIA</p>
            </div>
            <span className="arrow">→</span>
          </button>

          <button className="action-card ai-card">
            <div className="action-icon">AI</div>
            <div>
              <h3>Verificar Plano</h3>
              <p>Revisar requisitos y detectar inconsistencias</p>
            </div>
            <span className="arrow">→</span>
          </button>
        </section>

        <section className="info-panel">
          <div>
            <span className="info-number">01</span>
            <p>Datos del predio</p>
          </div>

          <div>
            <span className="info-number">02</span>
            <p>Levantamiento</p>
          </div>

          <div>
            <span className="info-number">03</span>
            <p>Generación del plano</p>
          </div>

          <div>
            <span className="info-number">04</span>
            <p>Verificación</p>
          </div>
        </section>
      </main>

      <footer>
        TopoIA · Sistema de asistencia para planos topográficos
      </footer>
    </div>
  )
}

export default App