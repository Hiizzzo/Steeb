# Lineamientos para el frontend: tareas y subtareas anidadas

Este documento indica qué debe implementar el frontend para consumir las APIs de tareas/subtareas, mostrar progreso y asegurar que la tarea principal solo se complete cuando todas las subtareas estén en `done`.

## Objetivo UX
- Visualizar jerarquía de tareas con progreso acumulado y estados claros (todo/in_progress/blocked/done).
- Facilitar creación/edición de subtareas y checklist, y evidencias de QA.
- Evitar marcar como completada la tarea principal si alguna subtarea no cumple criterios.

## Componentes y vistas
- **Vista de lista/Kanban**: columna o lista por estado (`todo`, `in_progress`, `blocked`, `done`) con tarjetas que muestran título, labels, owner, estimate y porcentaje de progreso (basado en subtareas). Permitir drag & drop entre columnas, respetando reglas (no arrastrar a `done` si hay subtareas pendientes).
- **Vista de detalle de tarea**:
  - Cabecera con título, owner, labels, estado y progreso.
  - **Subtareas**: listado anidado (hasta 3 niveles) con estado, checklist y dependencias visibles; botón "Añadir subtarea".
  - **Checklist y criterios**: toggles para checklist, texto de criterios de aceptación.
  - **Evidencias/QA**: área para adjuntar evidencia (link, nota, archivo) y mostrar historial.
  - **Auditoría**: timeline de cambios (quién/qué/cuándo) usando datos del backend.
- **Modal/formulario de tarea/subtarea**: crear/editar título, descripción, owner, estimate, labels y dependencias; campo `parent_task_id` oculto cuando aplique.

## Estado y sincronización con backend
- Fuente de verdad: respuestas de API; mantener cache local (p.ej. React Query/RTK Query) con invalidaciones al crear/editar.
- Cada cambio de estado, checklist o evidencia se envía de inmediato al backend; optimizar con updates optimistas y rollback en error.
- Calcular progresos en UI solo para mostrar, pero confiar en el `progress` que devuelve el backend para consistencia.

## Contrato API (consumo)
Usar los endpoints definidos en backend:
- `POST /tasks` (crear; incluir `parent_task_id` para subtareas).
- `PATCH /tasks/{task_id}` (actualizar estado, checklist, criterios, metadata).
- `GET /tasks/{task_id}` (detalle + subtareas anidadas + progreso calculado).
- `GET /tasks?parent_task_id=<id>` (listar subtareas directas para vistas jerárquicas/expandibles).
- `POST /tasks/{task_id}/acceptance` (adjuntar evidencia o resultado de QA).
- `POST /tasks/{task_id}/dependencies` (añadir/actualizar dependencias).

## Reglas de UI
- **Prohibir marcar como `done`** la tarea principal desde UI si `subtasks.some(!done)` o si falta evidencia requerida.
- Mostrar badges de bloqueo si alguna dependencia está `blocked`; prevenir drag & drop a `done` en ese caso.
- En checklist, deshabilitar cambio a `done` si faltan ítems obligatorios (marcados desde `acceptance_criteria`).
- Validar latencia: manejar spinners y reintentos; mostrar toast de error si falla persistencia y revertir cambios optimistas.

## QA y aceptance
- Tests de componentes: renderizar jerarquías y actualizar estado al recibir subtareas en diferentes niveles.
- Tests de integración: mock de endpoints para crear subtareas, actualizar checklist y reflejar progreso/calculo del backend.
- Validar accesibilidad (navegación teclado, aria-labels) en listas, modales y botones de estado.

## Handoff para Steeb
- Referenciar `task_id` y `parent_task_id` en logs/analíticas para trazabilidad.
- Incluir en cada PR capturas de la vista de detalle y lista mostrando subtareas y bloqueos.
- Si el backend devuelve error por dependencias, mostrar mensaje claro y conservar estado previo.
