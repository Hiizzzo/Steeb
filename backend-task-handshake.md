# Lineamientos para el backend: tareas anidadas

Este documento resume qué información enviar al equipo/backend para implementar tareas con subtareas anidadas y trazabilidad completa.

## Objetivo
Permitir que la tarea principal se marque como completada únicamente cuando todas las subtareas cumplan sus criterios de aceptación y estados de verificación.

## Datos mínimos a compartir con backend
- **Modelo de entidad**:
  - `task_id`, `parent_task_id` (nullable para la principal).
  - `title`, `description`, `owner`, `estimate`.
  - `status` (p.ej. `todo`, `in_progress`, `blocked`, `done`).
  - `acceptance_criteria` (lista de strings) y `checklist` (estado booleano por ítem).
  - `dependencies` (lista de `task_id` de las que depende).
  - `labels` o `type` (p.ej. `frontend`, `backend`, `qa`).
  - `progress` calculado: porcentaje basado en subtareas en `done`.
  - `audit` (`created_at`, `updated_at`, `completed_at`, usuario que actualiza el estado).
- **Reglas de negocio**:
  - Una tarea con subtareas solo pasa a `done` si **todas** las subtareas están en `done` y han pasado revisión/QA.
  - Bloqueos: si alguna dependencia está en `blocked`, la tarea principal refleja un estado derivado (p.ej. `blocked`).
  - Actualizar `progress` automáticamente al cambiar estados de subtareas.
- **Eventos/acciones**:
  - Crear/editar tarea, crear subtarea (asignando `parent_task_id`).
  - Cambiar estado, adjuntar evidencia de QA, marcar checklist.
  - Auditoría de cambios (quién, cuándo, qué se cambió).

## API sugerida (contrato mínimo)
- `POST /tasks` crea tarea; acepta `parent_task_id` para subtarea.
- `PATCH /tasks/{task_id}` actualiza título, descripción, estado, checklist y criterios.
- `GET /tasks/{task_id}` devuelve la tarea con sus subtareas (lista anidada) y progreso calculado.
- `GET /tasks?parent_task_id=<id>` lista subtareas directas (útil para vistas jerárquicas).
- `POST /tasks/{task_id}/acceptance` adjunta evidencia o resultado de QA.
- `POST /tasks/{task_id}/dependencies` para añadir/actualizar dependencias.

## Criterios de aceptación
- Las subtareas heredan el estado de bloqueo de sus dependencias y pueden bloquear la tarea principal.
- El porcentaje de avance se recalcula automáticamente tras cambios de estado o checklist.
- El endpoint `GET /tasks/{task_id}` responde en <500 ms con hasta 3 niveles de anidamiento (optimizar consultas/joins).
- Registro de auditoría accesible para cada cambio de estado o checklist.

## Información que debe saber Steeb (handoff)
- Para marcar progreso, siempre enviar eventos vía API (no actualizaciones manuales en BD).
- Referenciar `task_id` y `parent_task_id` en commits/PRs para mantener trazabilidad.
- Incluir en cada subtarea: responsable, estimación y criterios de aceptación claros.
- Flujo de cierre: QA adjunta evidencia en `POST /tasks/{task_id}/acceptance` → revisor cambia a `done` → la tarea principal se autocierra cuando todas las subtareas están en `done`.
