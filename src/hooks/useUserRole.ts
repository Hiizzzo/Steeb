import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { UserProfile, UserRole, USER_ROLES, ROLE_PERMISSIONS, ShinyRoll } from '@/types/user';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener perfil de usuario desde Firestore
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data() as Omit<UserProfile, 'uid' | 'email' | 'createdAt' | 'lastLoginAt'>;
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            name: data.name || user.displayName || '',
            nickname: data.nickname || '',
            role: data.role || USER_ROLES.WHITE,
            avatar: data.avatar || user.photoURL || '',
            shinyRolls: data.shinyRolls || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLoginAt: data.lastLoginAt?.toDate() || new Date()
          });
        } else {
          // Crear perfil de usuario nuevo - por defecto es WHITE
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            nickname: user.displayName || '',
            role: USER_ROLES.WHITE, // Todos empiezan como WHITE
            avatar: user.photoURL || '',
            shinyRolls: 0,
            createdAt: new Date(),
            lastLoginAt: new Date()
          };

          await setDoc(userDocRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });

          setUserProfile(newProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Actualizar último login
  const updateLastLogin = async () => {
    if (!user || !userProfile) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  // Obtener permisos del usuario actual
  const getPermissions = () => {
    if (!userProfile) return ROLE_PERMISSIONS[USER_ROLES.WHITE];
    return ROLE_PERMISSIONS[userProfile.role];
  };

  // Verificar si puede usar un modo específico
  const canUseMode = (mode: 'white' | 'dark' | 'shiny') => {
    const permissions = getPermissions();

    switch (mode) {
      case 'white':
        return permissions.canUseWhiteMode;
      case 'dark':
        return permissions.canUseDarkMode;
      case 'shiny':
        return permissions.canUseShinyMode;
      default:
        return false;
    }
  };

  // Verificar si puede comprar tiradas shiny
  const canBuyShinyRolls = () => {
    return getPermissions().canBuyShinyRolls;
  };

  // Comprar tirada shiny
  const buyShinyRoll = async () => {
    if (!userProfile || !canBuyShinyRolls()) {
      throw new Error('No tienes permisos para comprar tiradas shiny');
    }

    // Aquí iría la integración con Mercado Pago u otro sistema de pago
    // Por ahora, simulamos la compra
    try {
      const userDocRef = doc(db, 'users', user.uid);

      // Crear registro de la tirada comprada
      const shinyRollRef = doc(db, 'shinyRolls', `${user.uid}_${Date.now()}`);
      await setDoc(shinyRollRef, {
        userId: user.uid,
        purchasedAt: serverTimestamp(),
        used: false,
        price: 500 // Precio fijo por ahora
      });

      // Actualizar contador de tiradas
      const newShinyRollsCount = (userProfile.shinyRolls || 0) + 1;
      await updateDoc(userDocRef, {
        shinyRolls: newShinyRollsCount
      });

      setUserProfile(prev => prev ? {
        ...prev,
        shinyRolls: newShinyRollsCount
      } : null);

      return true;
    } catch (error) {
      console.error('Error buying shiny roll:', error);
      throw error;
    }
  };

  // Usar tirada shiny
  const useShinyRoll = async () => {
    if (!userProfile || (userProfile.shinyRolls || 0) === 0) {
      throw new Error('No tienes tiradas shiny disponibles');
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);

      // Buscar la primera tirada shiny no usada
      const shinyRollsQuery = await getDoc(
        doc(db, 'shinyRolls', `${user.uid}_unused`)
      );

      if (!shinyRollsQuery.exists()) {
        // Crear una tirada shiny si no existe (fallback)
        const shinyRollRef = doc(db, 'shinyRolls', `${user.uid}_${Date.now()}`);
        await setDoc(shinyRollRef, {
          userId: user.uid,
          purchasedAt: serverTimestamp(),
          used: true,
          usedAt: serverTimestamp(),
          price: 0
        });
      } else {
        // Marcar como usada la tirada existente
        await updateDoc(shinyRollsQuery.ref, {
          used: true,
          usedAt: serverTimestamp()
        });
      }

      // Actualizar contador
      const newShinyRollsCount = Math.max((userProfile.shinyRolls || 0) - 1, 0);
      await updateDoc(userDocRef, {
        shinyRolls: newShinyRollsCount
      });

      setUserProfile(prev => prev ? {
        ...prev,
        shinyRolls: newShinyRollsCount
      } : null);

      return true;
    } catch (error) {
      console.error('Error using shiny roll:', error);
      throw error;
    }
  };

  // Actualizar rol de usuario (solo para admin o upgrades pagos)
  const updateUserRole = async (newRole: UserRole) => {
    if (!userProfile) {
      throw new Error('No hay perfil de usuario');
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        role: newRole
      });

      setUserProfile(prev => prev ? {
        ...prev,
        role: newRole
      } : null);

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Obtener información del rol actual
  const getRoleInfo = () => {
    if (!userProfile) return null;

    const role = userProfile.role;
    const permissions = ROLE_PERMISSIONS[role];

    return {
      role,
      permissions,
      canUpgradeToDark: role === USER_ROLES.WHITE,
      canUpgradeToShiny: role !== USER_ROLES.SHINY,
      shinyRollsAvailable: userProfile.shinyRolls || 0
    };
  };

  return {
    userProfile,
    isLoading,
    getPermissions,
    canUseMode,
    canBuyShinyRolls,
    buyShinyRoll,
    useShinyRoll,
    updateUserRole,
    getRoleInfo,
    updateLastLogin
  };
};