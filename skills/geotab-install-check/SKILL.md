---
name: geotab-install-check
description: >
  Verifica que la instalación de un dispositivo Geotab GO esté correctamente
  configurada en una flota. Úsalo siempre que el usuario quiera comprobar si
  un vehículo o lista de vehículos está bien instalado, si el dispositivo GO
  reporta correctamente, o cuando se mencionen fases de instalación, checklist
  de instalación, validación de nuevos vehículos, o "verificar que la
  instalación está bien hecha". También aplica cuando el usuario sube un
  archivo Excel/XLS/CSV con una lista de vehículos nuevos y quiere saber el
  estado de cada uno, o cuando pregunta si el dispositivo está enviando datos,
  si el firmware está actualizado, si hay IOX conectados, si lee odómetro, o
  si hay fault codes activos.
compatibility:
  mcps:
    - Geotab MCP (cualquier servidor/base de datos)
---

# Skill: Verificar instalación Geotab

Este skill ejecuta el checklist de 6 fases de instalación para cada dispositivo
GO y genera una planilla Excel con el estado de cada vehículo.

El Add-In correspondiente está en `examples/addins/install-check.html`.

---

## Fases del checklist

| # | Fase | Cómo verificarlo en la API |
|---|------|---------------------------|
| 1 | **Reportando** | `DeviceStatusInfo` → `dateTime` reciente (< 24 h) |
| 2 | **Firmware descargado** | `FaultData` con `DiagnosticDeviceRestartedBecauseOfFirmwareUpdateId` en los últimos 90 días |
| 3 | **Voltaje de batería** | `StatusData` con `DiagnosticGoDeviceVoltageId` → valor en volts (normal: 11–15 V) |
| 4 | **IOX conectados** | `IoxAddOn` → lista de add-ons con `channel > 0` (activos) |
| 5 | **Lee odómetro** | `StatusData` con `DiagnosticOdometerId` con datos recientes |
| 6 | **Fault codes activos** | `FaultData` con `faultState = "Active"` — separar faults GO device vs faults del vehículo (motor) |

---

## Flujo de ejecución con MCP

### Paso 1 — Obtener lista de dispositivos

**Si el usuario sube un archivo XLS/CSV:**
- Leer el archivo con pandas
- Extraer identificadores: puede ser nombre de dispositivo, serial number, VIN, o device ID
- Para cada vehículo, buscar en Geotab con `Get(typeName="Device", search={name o serialNumber o VIN})`

**Si no hay archivo:**
- Obtener todos los dispositivos con `Get(typeName="Device", resultsLimit=50)`

### Paso 2 — Para cada dispositivo, ejecutar en paralelo

```python
from datetime import datetime, timedelta, timezone

now = datetime.now(timezone.utc)
ago90 = (now - timedelta(days=90)).isoformat()
ago30 = (now - timedelta(days=30)).isoformat()
today = (now - timedelta(days=2)).isoformat()

# 1. Última comunicación (bulk — un solo call para todos)
status_info = api.Get("DeviceStatusInfo", search={}, resultsLimit=5000)
# → dict keyed by device.id

# 2. Firmware
api.Get("FaultData", search={
    "deviceSearch": {"id": device_id},
    "diagnosticSearch": {"id": "DiagnosticDeviceRestartedBecauseOfFirmwareUpdateId"},
    "fromDate": ago90
})

# 3. Voltaje GO device
api.Get("StatusData", search={
    "deviceSearch": {"id": device_id},
    "diagnosticSearch": {"id": "DiagnosticGoDeviceVoltageId"},
    "fromDate": today
}, resultsLimit=3)

# 4. IOX conectados
api.Get("IoxAddOn", search={"deviceSearch": {"id": device_id}})

# 5. Odómetro
api.Get("StatusData", search={
    "deviceSearch": {"id": device_id},
    "diagnosticSearch": {"id": "DiagnosticOdometerId"},
    "fromDate": today
}, resultsLimit=3)

# 6. Fault codes activos
api.Get("FaultData", search={
    "deviceSearch": {"id": device_id},
    "faultStates": ["Active"],
    "fromDate": ago30
})
```

### Paso 3 — Evaluar resultados

| Estado | Criterio |
|--------|----------|
| ✅ OK | Fase cumplida sin problemas |
| ⚠️ ADVERTENCIA | Cumplida pero con algo a revisar |
| ❌ FALLA | No hay datos, valor fuera de rango, fault activo de motor |
| — N/A | No aplica (ej. CustomVehicleDevice no tiene firmware GO) |

**Reglas específicas:**
- Reportando: ✅ si `dateTime` < 24 h, ⚠️ si 24–72 h, ❌ si > 72 h o sin datos
- Firmware: ✅ si hubo update en últimos 90 días, ⚠️ si fue hace más, ❌ si nunca
- Voltaje: ✅ si 11–15 V, ⚠️ si 10–11 V, ❌ si < 10 V o sin datos
- IOX: ✅ si todos activos (channel > 0), ⚠️ si alguno en ch.0, — si no hay IOX
- Odómetro: ✅ si lee, ❌ si no hay lecturas
- Faults motor: ✅ si ninguno activo, ⚠️ si hay faults GO, ❌ si hay DTCs de motor activos
  - controller = `ControllerGoDeviceId` → fault del sistema GO (no DTC real)
  - otros controllers → DTCs del motor/vehículo

### Paso 4 — Generar planilla Excel con openpyxl

```python
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment
from openpyxl.utils import get_column_letter
from datetime import date

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Resumen"

COLORS = {
    "OK":   {"bg": "C6EFCE", "fg": "006100"},
    "WARN": {"bg": "FFEB9C", "fg": "9C6500"},
    "FAIL": {"bg": "FFC7CE", "fg": "9C0006"},
    "NA":   {"bg": "F2F2F2", "fg": "595959"},
}

headers = ["Vehículo", "Tipo dispositivo", "Serial",
           "1 Reportando", "2 Firmware", "3 Voltaje (V)",
           "4 IOX", "5 Odómetro", "6 Faults motor", "Estado global"]

# Header row styling
for col, h in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col, value=h)
    cell.fill = PatternFill("solid", fgColor="002060")
    cell.font = Font(color="FFFFFF", bold=True)
    cell.alignment = Alignment(horizontal="center")

ws.row_dimensions[1].height = 18
ws.freeze_panes = "A2"
ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}1"

# Data rows
for row_idx, r in enumerate(results, 2):
    ws.cell(row=row_idx, column=1, value=r["name"])
    ws.cell(row=row_idx, column=2, value=r["type"])
    ws.cell(row=row_idx, column=3, value=r["serial"])
    phases = ["reporting", "firmware", "voltage", "iox", "odo", "faults"]
    for col_offset, phase_key in enumerate(phases, 4):
        p = r["phases"][phase_key]
        status = p["status"]
        cell = ws.cell(row=row_idx, column=col_offset, value=f"{p['value']}")
        c = COLORS.get(status, COLORS["NA"])
        cell.fill = PatternFill("solid", fgColor=c["bg"])
        cell.font = Font(color=c["fg"])
    # Global status
    g_cell = ws.cell(row=row_idx, column=10, value=r["global"])
    gc = COLORS.get(r["global"], COLORS["NA"])
    g_cell.fill = PatternFill("solid", fgColor=gc["bg"])
    g_cell.font = Font(color=gc["fg"], bold=True)

# Column widths
col_widths = [28, 16, 18, 16, 16, 14, 22, 14, 22, 16]
for i, w in enumerate(col_widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w

# Sheet 2: Detalle
ws2 = wb.create_sheet("Detalle")
det_headers = ["Vehículo", "Serial", "Fase", "Estado", "Valor", "Notas"]
ws2.append(det_headers)
phase_names = {
    "reporting": "1 Reportando", "firmware": "2 Firmware",
    "voltage": "3 Voltaje", "iox": "4 IOX",
    "odo": "5 Odómetro", "faults": "6 Faults motor"
}
for r in results:
    for k, p in r["phases"].items():
        ws2.append([r["name"], r["serial"], phase_names.get(k, k),
                    p["status"], p["value"], p.get("note", "")])

filename = f"checklist_instalacion_{date.today()}.xlsx"
wb.save(filename)
print(f"Guardado: {filename}")
```

---

## Tipos de IOX más comunes

| type | Nombre |
|------|--------|
| 4291 | IOX-USB (power harvesting) |
| 4290 | IOX desconectado / sin canal |
| 4194 | IOX-CAN |
| 4160 | IOX-RS232 |
| 4195 | IOX-BT |
| 4196 | IOX-NFC |

---

## Notas importantes

- **No mostrar PII**: nunca incluir nombres de conductores, emails, ni teléfonos en la planilla.
- **CustomVehicleDevice**: marcar Firmware como N/A, el resto aplica normal.
- **Batch**: si hay más de 10 vehículos, procesar en grupos de 10.
- **DeviceStatusInfo**: hacer el call una sola vez para toda la flota y luego filtrar por device.id.
- **Credenciales**: usar la misma base de datos/servidor que el usuario indicó en la conversación.

---

## Salida esperada

1. Tabla visual en el chat con colores por estado
2. Archivo `checklist_instalacion_<fecha>.xlsx` para descargar
3. Comentario breve señalando vehículos que necesitan atención
