import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Edit2, Trash2, Tag, FolderOpen, Hash, Target, Briefcase, Heart, Brain, Users } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  taskCount: number;
  isDefault: boolean;
}

const CategoryManager: React.FC = () => {
  const { tasks } = useTaskStore();

  const defaultCategories: Category[] = [
    { id: 'trabajo', name: 'Trabajo', color: 'bg-blue-500', icon: '💼', taskCount: 0, isDefault: true },
    { id: 'personal', name: 'Personal', color: 'bg-green-500', icon: '👤', taskCount: 0, isDefault: true },
    { id: 'salud', name: 'Salud', color: 'bg-red-500', icon: '❤️', taskCount: 0, isDefault: true },
    { id: 'estudio', name: 'Estudio', color: 'bg-purple-500', icon: '📚', taskCount: 0, isDefault: true },
    { id: 'social', name: 'Social', color: 'bg-yellow-500', icon: '👥', taskCount: 0, isDefault: true },
    { id: 'creatividad', name: 'Creatividad', color: 'bg-pink-500', icon: '🎨', taskCount: 0, isDefault: true },
    { id: 'finanzas', name: 'Finanzas', color: 'bg-emerald-500', icon: '💰', taskCount: 0, isDefault: true },
    { id: 'hogar', name: 'Hogar', color: 'bg-orange-500', icon: '🏠', taskCount: 0, isDefault: true }
  ];

  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: 'bg-blue-500',
    icon: '📌'
  });

  const colors = [
    { name: 'Azul', class: 'bg-blue-500' },
    { name: 'Verde', class: 'bg-green-500' },
    { name: 'Rojo', class: 'bg-red-500' },
    { name: 'Morado', class: 'bg-purple-500' },
    { name: 'Amarillo', class: 'bg-yellow-500' },
    { name: 'Rosa', class: 'bg-pink-500' },
    { name: 'Naranja', class: 'bg-orange-500' },
    { name: 'Teal', class: 'bg-teal-500' },
    { name: 'Indigo', class: 'bg-indigo-500' },
    { name: 'Gris', class: 'bg-gray-500' }
  ];

  const icons = ['📌', '⭐', '🔥', '⚡', '🎯', '🚀', '💡', '🌟', '✨', '🎪', '🎭', '🎮', '🏆', '🎨', '🎬', '🎵', '📚', '🏃', '🚲', '🌈'];

  // Calcular cantidad de tareas por categoría
  React.useEffect(() => {
    const updatedCategories = categories.map(category => ({
      ...category,
      taskCount: tasks.filter(task => task.category === category.name).length
    }));
    setCategories(updatedCategories);
  }, [tasks]);

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const category: Category = {
        id: Date.now().toString(),
        name: newCategory.name.trim(),
        color: newCategory.color,
        icon: newCategory.icon,
        taskCount: 0,
        isDefault: false
      };

      setCategories([...categories, category]);
      setNewCategory({ name: '', color: 'bg-blue-500', icon: '📌' });
      setShowAddModal(false);
      console.log('✅ Categoría creada:', category.name);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      icon: category.icon
    });
    setShowAddModal(true);
  };

  const handleUpdateCategory = () => {
    if (editingCategory && newCategory.name.trim()) {
      setCategories(categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: newCategory.name.trim(), color: newCategory.color, icon: newCategory.icon }
          : cat
      ));
      setEditingCategory(null);
      setNewCategory({ name: '', color: 'bg-blue-500', icon: '📌' });
      setShowAddModal(false);
      console.log('✅ Categoría actualizada:', newCategory.name);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.taskCount > 0) {
      alert(`No se puede eliminar "${category.name}" porque tiene ${category.taskCount} tareas asociadas.`);
      return;
    }

    if (category && window.confirm(`¿Estás seguro de que querés eliminar la categoría "${category.name}"?`)) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
      console.log('🗑️ Categoría eliminada:', category.name);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setNewCategory({ name: '', color: 'bg-blue-500', icon: '📌' });
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
              <Tag className="w-10 h-10 mr-3" />
              Categorías
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Organizá tus tareas por categorías personalizadas
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Categoría
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <FolderOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-black dark:text-white">{categories.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Categorías</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <Hash className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-black dark:text-white">
              {categories.reduce((sum, cat) => sum + cat.taskCount, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tareas Totales</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-black dark:text-white">
              {categories.filter(cat => cat.taskCount > 0).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Categorías Activas</p>
          </motion.div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl relative group hover:shadow-lg transition-all"
            >
              {/* Actions */}
              {!category.isDefault && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}

              <div className="flex items-center mb-3">
                <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-2xl mr-3`}>
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black dark:text-white">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.taskCount} tarea{category.taskCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${category.color} h-2 rounded-full transition-all duration-300`}
                  style={{
                    width: `${Math.max((category.taskCount / Math.max(...categories.map(c => c.taskCount))) * 100, 5)}%`
                  }}
                />
              </div>

              {category.isDefault && (
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                  Categoría del sistema
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Add/Edit Modal */}
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
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1">
                    Nombre de la categoría
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white rounded-lg"
                    placeholder="Ej: Proyectos personales"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Icono
                  </label>
                  <div className="grid grid-cols-10 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-lg transition-all ${
                          newCategory.icon === icon
                            ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-800'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.class}
                        onClick={() => setNewCategory({ ...newCategory, color: color.class })}
                        className={`h-10 ${color.class} rounded-lg border-2 transition-all ${
                          newCategory.color === color.class
                            ? 'border-black dark:border-white scale-110'
                            : 'border-transparent hover:border-gray-400'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Vista previa
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg flex items-center">
                    <div className={`w-10 h-10 ${newCategory.color} rounded-lg flex items-center justify-center text-lg mr-3`}>
                      {newCategory.icon}
                    </div>
                    <div>
                      <p className="font-medium text-black dark:text-white">
                        {newCategory.name || 'Nombre de la categoría'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        0 tareas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CategoryManager;