import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Trophy, Users, TrendingUp, Calendar } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';

interface SocialPost {
  id: string;
  user: string;
  avatar: string;
  task: string;
  completedAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  category: string;
}

const Social: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: '1',
      user: 'Santi',
      avatar: '👨‍💻',
      task: 'Completé el proyecto de React',
      completedAt: 'Hace 2 horas',
      likes: 12,
      comments: 3,
      isLiked: false,
      category: 'Trabajo'
    },
    {
      id: '2',
      user: 'Maria',
      avatar: '👩‍🎨',
      task: 'Terminé el diseño del dashboard',
      completedAt: 'Hace 4 horas',
      likes: 8,
      comments: 1,
      isLiked: true,
      category: 'Diseño'
    },
    {
      id: '3',
      user: 'Leo',
      avatar: '🚀',
      task: 'Corrí 5km sin parar',
      completedAt: 'Hace 6 horas',
      likes: 15,
      comments: 5,
      isLiked: false,
      category: 'Salud'
    }
  ]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleShare = (post: SocialPost) => {
    // Simular share
    const text = `¡${post.user} completó "${post.task}"! 🎉`;
    if (navigator.share) {
      navigator.share({
        title: 'STEEB - Logro compartido',
        text: text
      });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(text);
      alert('¡Logro copiado al portapapeles!');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-black dark:text-white mb-2 flex items-center">
            <Users className="w-10 h-10 mr-3" />
            Comunidad STEEB
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Compartí tus logros y motivá a otros
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-black dark:text-white">247</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Logros hoy</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-black dark:text-white">89%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de completion</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-black border-2 border-black dark:border-white p-4 rounded-xl text-center"
          >
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-black dark:text-white">1,247</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios activos</p>
          </motion.div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 rounded-xl"
            >
              {/* Post Header */}
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-3">{post.avatar}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-black dark:text-white">{post.user}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {post.completedAt} • {post.category}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-lg text-black dark:text-white font-medium">
                  ✅ {post.task}
                </p>
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      post.isLiked ? 'text-red-600' : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`}
                    />
                    <span>{post.likes}</span>
                  </button>

                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleShare(post)}
                  className="text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Post Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
          onClick={() => {
            // Aquí iría la lógica para crear un nuevo post
            alert('¡Función de crear post coming soon!');
          }}
        >
          <span className="text-2xl">+</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Social;