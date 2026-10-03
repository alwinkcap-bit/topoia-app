import ezdxf
import json
import math
import sys
from pathlib import Path

DXF = Path("cartografia/dxf/LOCALIZACION REGIONAL HE (1).dxf")

print(f"Leyendo cartografia: {DXF}")
doc = ezdxf.readfile(DXF)
msp = doc.modelspace()
print(f"Entidades cargadas: {len(msp)}")

ESTE = float(sys.argv[1]) if len(sys.argv) > 1 else 563000.0
NORTE = float(sys.argv[2]) if len(sys.argv) > 2 else 883000.0
RADIO = float(sys.argv[3]) if len(sys.argv) > 3 else 1000.0

print(f"Centro: E={ESTE:.2f} N={NORTE:.2f}")
print(f"Radio de extraccion: {RADIO:.0f} m")

from ezdxf import bbox

xmin = ESTE - RADIO
xmax = ESTE + RADIO
ymin = NORTE - RADIO
ymax = NORTE + RADIO

cache = bbox.Cache()
seleccionadas = []

for entidad in msp:
    try:
        caja = bbox.extents([entidad], cache=cache)
        if not caja.has_data:
            continue

        toca_sector = not (
            caja.extmax.x < xmin or
            caja.extmin.x > xmax or
            caja.extmax.y < ymin or
            caja.extmin.y > ymax
        )

        if toca_sector:
            seleccionadas.append(entidad)
    except Exception:
        continue

print(f"Entidades dentro del sector: {len(seleccionadas)}")
from collections import Counter

capas_sector = Counter(e.dxf.layer for e in seleccionadas)

print("CAPAS DEL SECTOR:")
for capa, cantidad in capas_sector.most_common():
    print(cantidad, "|", capa)
tipos_sector = Counter(e.dxftype() for e in seleccionadas)

print("TIPOS DE ENTIDAD DEL SECTOR:")
for tipo, cantidad in tipos_sector.most_common():
    print(cantidad, "|", tipo)

elementos = []

for e in seleccionadas:
    if e.dxftype() == "LINE":
        elementos.append({
            "tipo": "linea",
            "capa": e.dxf.layer,
            "puntos": [
                [e.dxf.start.x, e.dxf.start.y],
                [e.dxf.end.x, e.dxf.end.y],
            ],
        })

    elif e.dxftype() == "LWPOLYLINE":
        puntos = [
            [p[0], p[1]]
            for p in e.get_points()
        ]

        elementos.append({
            "tipo": "polilinea",
            "capa": e.dxf.layer,
            "cerrada": bool(e.closed),
            "puntos": puntos,
        })

print("LINEAS Y POLILINEAS EXPORTABLES:", len(elementos))

arcos_exportados = 0

for e in seleccionadas:
    if e.dxftype() != "ARC":
        continue

    centro = e.dxf.center
    radio = e.dxf.radius
    inicio = e.dxf.start_angle
    fin = e.dxf.end_angle

    if fin < inicio:
        fin += 360

    amplitud = fin - inicio
    pasos = max(8, math.ceil(amplitud / 5))

    puntos = []

    for i in range(pasos + 1):
        angulo = math.radians(
            inicio + amplitud * i / pasos
        )

        x = centro.x + radio * math.cos(angulo)
        y = centro.y + radio * math.sin(angulo)

        puntos.append([x, y])

    elementos.append({
        "tipo": "arco",
        "capa": e.dxf.layer,
        "puntos": puntos,
    })

    arcos_exportados += 1

print("ARCOS EXPORTADOS:", arcos_exportados)
print("GEOMETRIAS EXPORTABLES:", len(elementos))
salida = Path(f"cartografia/procesada/sector_{int(ESTE)}_{int(NORTE)}.json")

datos_salida = {
    "centro": {"este": ESTE, "norte": NORTE},
    "radio": RADIO,
    "elementos": elementos,
}

with salida.open("w", encoding="utf-8") as f:
    json.dump(datos_salida, f, ensure_ascii=False, separators=(",", ":"))

print("ARCHIVO GENERADO:", salida)

textos = []

for e in seleccionadas:
    if e.dxftype() not in ("TEXT", "MTEXT"):
        continue

    try:
        contenido = e.plain_text().strip()
        posicion = e.dxf.insert

        if contenido:
            textos.append({
                "capa": e.dxf.layer,
                "texto": contenido,
                "este": posicion.x,
                "norte": posicion.y,
            })
    except Exception:
        continue

print("TEXTOS EXPORTABLES:", len(textos))

datos_salida["textos"] = textos

with salida.open("w", encoding="utf-8") as f:
    json.dump(datos_salida, f, ensure_ascii=False, separators=(",", ":"))

print("JSON FINAL ACTUALIZADO")
print("GEOMETRIAS:", len(elementos))
print("TEXTOS:", len(textos))

# Actualizar indice general de sectores
sectores_indice = []

for archivo_sector in sorted(salida.parent.glob("sector_*.json")):
    try:
        datos_sector = json.loads(
            archivo_sector.read_text(encoding="utf-8")
        )

        sectores_indice.append({
            "archivo": archivo_sector.name,
            "este": datos_sector["centro"]["este"],
            "norte": datos_sector["centro"]["norte"],
            "radio": datos_sector["radio"],
            "geometrias": len(datos_sector.get("elementos", [])),
            "textos": len(datos_sector.get("textos", [])),
        })
    except Exception as error:
        print("No se pudo indexar:", archivo_sector.name, error)

indice = salida.parent / "indice_sectores.json"

indice.write_text(
    json.dumps(
        {"sectores": sectores_indice},
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print("INDICE ACTUALIZADO:", indice)
print("SECTORES DISPONIBLES:", len(sectores_indice))
