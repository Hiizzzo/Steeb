import { useState, useEffect } from 'react';

interface UserProfile {
  name: string;
  nickname: string;
  isSetup: boolean;
}

const PROFILE_STORAGE_KEY = 'stebe-user-profile';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    nickname: '',
    isSetup: false
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }
  }, []);

  const saveProfile = (name: string, nickname: string) => {
    const newProfile: UserProfile = {
      name,
      nickname,
      isSetup: true
    };
    setProfile(newProfile);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
  };

  const clearProfile = () => {
    const emptyProfile: UserProfile = {
      name: '',
      nickname: '',
      isSetup: false
    };
    setProfile(emptyProfile);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  return {
    profile,
    saveProfile,
    clearProfile,
    isSetup: profile.isSetup,
    name: profile.name,
    nickname: profile.nickname
  };
};
