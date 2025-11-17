import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Plus, X, Tag, Users } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  category: string;
  attendees?: number;
  description?: string;
  isAllDay: boolean;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Reunión de equipo',
      date: '2024-01-15',
      time: '10:00',
      location: 'Office',
      category: 'Trabajo',
      attendees: 5,
      isAllDay: false
    },
    {
      id: '2',
      title: 'Cumpleaños de Santi',
      date: '2024-01-20',
      time: '',
      location: 'Casa',
      category: 'Personal',
      attendees: 15,
      isAllDay: true
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    category: 'Trabajo',
    attendees: 0,
    description: '',
    isAllDay: false
  });

  const categories = ['Trabajo', 'Personal', 'Salud', 'Estudio', 'Social', 'Otro'];

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date) {
      const event: Event = {
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time || '',
        location: newEvent.location,
        category: newEvent.category || 'Trabajo',
        attendees: newEvent.attendees,
        description: newEvent.description,
        isAllDay: newEvent.isAllDay || false
      };

      setEvents([...events, event]);
      setNewEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        category: 'Trabajo',
        attendees: 0,
        description: '',
        isAllDay: false
      });
      setShowAddModal(false);

      ('✅ Evento creado:', event.title);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('¿Estás seguro de que querés eliminar este evento?')) {
      setEvents(events.filter(event => event.id !== eventId));
      ('🗑️ Evento eliminado');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-black dark:text-white mb-2 flex items-center">
              <Calendar className="w-10 h-10 mr-3" />
              Eventos
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Organizá tu tiempo y nunca te olvides de nada importante
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Evento
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <p className="text-2xl font-bold text-black dark:text-white">{events.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Eventos</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <p className="text-2xl font-bold text-blue-600">
              {events.filter(e => {
                const eventDate = new Date(e.date);
                const today = new Date();
                return eventDate >= today;
              }).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Próximos</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <p className="text-2xl font-bold text-orange-600">
              {events.filter(e => {
                const eventDate = new Date(e.date);
                const today = new Date();
                return eventDate.toDateString() === today.toDateString();
              }).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hoy</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <p className="text-2xl font-bold text-green-600">{categories.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Categorías</p>
          </motion.div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl relative group"
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>

              <div className="mb-4">
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">
                  {event.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  {event.time && !event.isAllDay && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.time}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                  {event.attendees && event.attendees > 0 && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {event.attendees} personas
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full">
                  {event.category}
                </span>
                {event.isAllDay && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Todo el día
                  </span>
                )}
              </div>

              {event.description && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {event.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  Nuevo Evento
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    Título del evento
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-lg"
                    placeholder="Ej: Reunión importante"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-1">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      disabled={newEvent.isAllDay}
                      className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-lg disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={newEvent.location || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-lg"
                    placeholder="Ej: Office, Casa, Zoom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    Categoría
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-lg"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={newEvent.isAllDay}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      isAllDay: e.target.checked,
                      time: e.target.checked ? '' : newEvent.time
                    })}
                    className="mr-2"
                  />
                  <label htmlFor="allDay" className="text-sm text-black dark:text-white">
                    Todo el día
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={newEvent.description || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-lg"
                    rows={3}
                    placeholder="Notas sobre el evento..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Crear Evento
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
              No hay eventos programados
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Creá tu primer evento para empezar a organizar tu tiempo
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Crear Primer Evento
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Events;