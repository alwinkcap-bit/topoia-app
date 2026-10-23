import { useEffect, useState } from 'react'

export default function LocalizacionRegionalManual() {
  const [imagen, setImagen] = useState(null)

  useEffect(() => {
    return () => {
      if (imagen) URL.revokeObjectURL(imagen)
    }
  }, [imagen])

  const cargarImagen = (evento) => {
    const archivo = evento.target.files?.[0]
    if (!archivo) return

    if (!['image/png', 'image/jpeg'].includes(archivo.type)) {
      alert('Selecciona una imagen PNG o JPG.')
      return
    }

    setImagen(URL.createObjectURL(archivo))
  }

  return (
    <div className="localizacion-regional-manual">
      <div className="localizacion-regional-manual-editor">
        <label>
          Cargar mapa de Localización Regional
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={cargarImagen}
          />
        </label>
      </div>

      <div
        style={{
          width: '120mm',
          height: '120mm',
          border: '1px solid #111',
          boxSizing: 'border-box',
          background: '#fff',
          padding: '3mm',
          display: 'flex',
          flexDirection: 'column',
          gap: '2mm',
        }}
      >
        <div style={{
          fontSize: '10px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          LOCALIZACIÓN REGIONAL
        </div>

        <div style={{
          flex: 1,
          minHeight: 0,
          border: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {imagen ? (
            <img
              src={imagen}
              alt="Localización Regional"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <span style={{
              fontSize: '10px',
              textAlign: 'center',
              color: '#777'
            }}>
              Cargar imagen del mapa
            </span>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .localizacion-regional-manual-editor {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
