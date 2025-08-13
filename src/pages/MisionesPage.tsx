import React, { useMemo, useEffect, useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import StebeHeader from '@/components/StebeHeader';
import TaskCard from '@/components/TaskCard';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star, ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { personalTasks } from '@/data/personalTasks';

const MisionesPage: React.FC = () => {
  const { tasks, updateTask, toggleTask, addTask } = useTaskStore();
  const [filterToday, setFilterToday] = useState(true);
  const [showPersonalSuggestions, setShowPersonalSuggestions] = useState(false);

  useEffect(() => {
    document.title = 'Misiones principales y secundarias | STEBE';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Organiza tus misiones principales del día y tus tareas secundarias en STEBE, tu asistente de productividad.');
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Organiza tus misiones principales del día y tus tareas secundarias en STEBE, tu asistente de productividad.';
      document.head.appendChild(m);
    }
    const linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      l.setAttribute('href', window.location.href);
      document.head.appendChild(l);
    }
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const normalized = useMemo(() => {
    const isPrimary = (t: any) => (t.tags || []).includes('principal');

    const all = filterToday
      ? tasks.filter(t => !t.scheduledDate || t.scheduledDate <= today)
      : tasks;

    const principales = all.filter(isPrimary);
    const secundarias = all.filter(t => !isPrimary(t));
    return { principales, secundarias };
  }, [tasks, filterToday]);

  const togglePrincipal = (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const current = t.tags || [];
    const has = current.includes('principal');
    const next = has ? current.filter(x => x !== 'principal') : [...current, 'principal'];
    updateTask(id, { tags: next }).catch(console.error);
  };

  const addPersonalTask = async (taskData: typeof personalTasks[0]) => {
    await addTask({
      title: taskData.title,
      type: taskData.type,
      subgroup: taskData.subgroup,
      priority: taskData.priority,
      estimatedDuration: taskData.estimatedDuration,
      status: 'pending',
      completed: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <StebeHeader />

      <main className="max-w-sm mx-auto px-3 pb-16">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-black flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Sólo hoy</label>
            <input type="checkbox" checked={filterToday} onChange={(e) => setFilterToday(e.target.checked)} />
          </div>
        </div>

        <h1 className="sr-only">Misiones principales y tareas secundarias</h1>

        {/* Misiones principales */}
        <section aria-labelledby="misiones-title" className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 id="misiones-title" className="text-lg font-semibold">Misiones principales de hoy</h2>
            </div>
            <span className="text-xs text-gray-500">{normalized.principales.length}</span>
          </div>

          {normalized.principales.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no marcaste misiones principales.</p>
          ) : (
            <div>
              {normalized.principales.map((t) => (
                <div key={t.id} className="mb-2">
                  <TaskCard
                    id={t.id}
                    title={t.title}
                    type={t.type}
                    completed={t.completed}
                    subtasks={t.subtasks}
                    scheduledDate={t.scheduledDate}
                    scheduledTime={t.scheduledTime}
                    notes={t.notes}
                    onToggle={toggleTask}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <Button size="sm" variant="secondary" onClick={() => togglePrincipal(t.id)}>
                      Quitar de misiones
                    </Button>
                    {!t.completed && (
                      <Button size="sm" onClick={() => toggleTask(t.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Completar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tareas secundarias */}
        <section aria-labelledby="secundarias-title">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
              <h2 id="secundarias-title" className="text-lg font-semibold">Tareas secundarias</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPersonalSuggestions(!showPersonalSuggestions)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Personal
              </Button>
              <span className="text-xs text-gray-500">{normalized.secundarias.length}</span>
            </div>
          </div>

          {/* Sugerencias de tareas personales */}
          {showPersonalSuggestions && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Tareas personales sugeridas:</h3>
              <div className="grid gap-2">
                {personalTasks.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500 capitalize flex items-center gap-2">
                        {/* Icono de subgrupo a la izquierda */}
                                        {task.subgroup === 'creatividad' ? (
                  <img src="/lovable-uploads/creatividad-icon.svg" alt="Creatividad" className="w-6 h-6" />
                        ) : null}
                        <span>{task.subgroup} • {task.estimatedDuration}min • {task.priority}</span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addPersonalTask(task)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {normalized.secundarias.length === 0 ? (
            <p className="text-sm text-gray-500">No hay tareas secundarias.</p>
          ) : (
            <div>
              {normalized.secundarias.map((t) => (
                <div key={t.id} className="mb-2">
                  <TaskCard
                    id={t.id}
                    title={t.title}
                    type={t.type}
                    completed={t.completed}
                    subtasks={t.subtasks}
                    scheduledDate={t.scheduledDate}
                    scheduledTime={t.scheduledTime}
                    notes={t.notes}
                    onToggle={toggleTask}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <Button size="sm" onClick={() => togglePrincipal(t.id)}>
                      Marcar como misión
                    </Button>
                    {!t.completed && (
                      <Button size="sm" variant="secondary" onClick={() => toggleTask(t.id)}>
                        Completar rápido
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MisionesPage;
