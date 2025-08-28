import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  nickname: string;
  avatar?: string;
  provider: 'google' | 'manual';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string, nickname: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, nickname: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada
    const savedUser = localStorage.getItem('stebe-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('stebe-user');
      }
    }
    setIsLoading(false);
  }, []);

  const saveUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('stebe-user', JSON.stringify(userData));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const usersDb = JSON.parse(localStorage.getItem('stebe-users-db') || '{}');
      const user = Object.values(usersDb).find((u: any) => 
        u.email === email && u.password === password && u.provider === 'manual'
      );
      
      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      const { password: _, ...userWithoutPassword } = user as any;
      saveUser(userWithoutPassword);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Simular Google OAuth - en producción usarías Google Identity Services
      // Por ahora simulamos con un prompt para el email
      const email = prompt('Ingresa tu email de Google:');
      if (!email) {
        throw new Error('Email requerido');
      }

      // Verificar si el usuario ya existe
      const existingUsers = JSON.parse(localStorage.getItem('stebe-users-db') || '{}');
      const existingUser = Object.values(existingUsers).find((u: any) => u.email === email && u.provider === 'google');
      
      if (existingUser) {
        // Usuario existente
        saveUser(existingUser as User);
      } else {
        // Nuevo usuario de Google
        const newGoogleUser: User = {
          id: 'google_' + Date.now(),
          email,
          name: '', // Vacío para forzar onboarding
          nickname: '', // Vacío para forzar onboarding
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=4285f4&color=fff`,
          provider: 'google',
          createdAt: new Date().toISOString()
        };
        
        // Guardar en la "base de datos"
        existingUsers[newGoogleUser.id] = newGoogleUser;
        localStorage.setItem('stebe-users-db', JSON.stringify(existingUsers));
        
        saveUser(newGoogleUser);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, nickname: string) => {
    setIsLoading(true);
    try {
      const usersDb = JSON.parse(localStorage.getItem('stebe-users-db') || '{}');
      
      // Verificar si el email ya existe
      const existingUser = Object.values(usersDb).find((u: any) => u.email === email);
      if (existingUser) {
        throw new Error('Este email ya está registrado');
      }

      const newUser: User = {
        id: 'manual_' + Date.now(),
        email,
        name,
        nickname,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        provider: 'manual',
        createdAt: new Date().toISOString()
      };

      // Guardar usuario en la "base de datos"
      usersDb[newUser.id] = { ...newUser, password };
      localStorage.setItem('stebe-users-db', JSON.stringify(usersDb));

      // Inicializar datos del usuario
      localStorage.setItem(`stebe-tasks-${newUser.id}`, JSON.stringify([]));
      localStorage.setItem(`stebe-settings-${newUser.id}`, JSON.stringify({
        language: 'es',
        notifications: true,
        theme: 'light'
      }));

      saveUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stebe-user');
    // Limpiar cualquier caché temporal
    sessionStorage.clear();
  };

  const updateProfile = (name: string, nickname: string) => {
    if (user) {
      const updatedUser = { ...user, name, nickname };
      
      // Actualizar en la "base de datos"
      const usersDb = JSON.parse(localStorage.getItem('stebe-users-db') || '{}');
      if (usersDb[user.id]) {
        usersDb[user.id] = { ...usersDb[user.id], name, nickname };
        localStorage.setItem('stebe-users-db', JSON.stringify(usersDb));
      }
      
      // Inicializar datos del usuario si es nuevo
      if (!localStorage.getItem(`stebe-tasks-${user.id}`)) {
        localStorage.setItem(`stebe-tasks-${user.id}`, JSON.stringify([]));
      }
      if (!localStorage.getItem(`stebe-settings-${user.id}`)) {
        localStorage.setItem(`stebe-settings-${user.id}`, JSON.stringify({
          language: 'es',
          notifications: true,
          theme: 'light'
        }));
      }
      
      saveUser(updatedUser);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile
  };
};

export { AuthContext };
