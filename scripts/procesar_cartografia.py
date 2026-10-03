import ezdxf
from pathlib import Path

DXF = Path("cartografia/dxf/LOCALIZACION REGIONAL HE (1).dxf")

print(f"Leyendo cartografia: {DXF}")
doc = ezdxf.readfile(DXF)
msp = doc.modelspace()
print(f"Entidades cargadas: {len(msp)}")

ESTE = 563000.0
NORTE = 883000.0
RADIO = 1000.0

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
