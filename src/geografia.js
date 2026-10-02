import proj4 from 'proj4'

// WGS 84 / UTM Zona 17 Norte
const UTM_17N =
  '+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs'

const WGS84 = 'EPSG:4326'

export function utm17NAGeograficas(este, norte) {
  const e = Number(este)
  const n = Number(norte)

  if (!Number.isFinite(e) || !Number.isFinite(n)) {
    return null
  }

  const [longitud, latitud] = proj4(
    UTM_17N,
    WGS84,
    [e, n]
  )

  return {
    latitud,
    longitud,
  }
}

export function calcularCentroPuntos(puntos = []) {
  const validos = puntos.filter((punto) => {
    const norte = Number(punto.norte)
    const este = Number(punto.este)

    return Number.isFinite(norte) && Number.isFinite(este)
  })

  if (validos.length === 0) {
    return null
  }

  const suma = validos.reduce(
    (total, punto) => ({
      norte: total.norte + Number(punto.norte),
      este: total.este + Number(punto.este),
    }),
    { norte: 0, este: 0 }
  )

  return {
    norte: suma.norte / validos.length,
    este: suma.este / validos.length,
  }
}
