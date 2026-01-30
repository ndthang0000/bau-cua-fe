import { useRef, useCallback } from 'react';

/**
 * Hook để quản lý âm thanh trong game
 * Sử dụng HTML5 Audio API
 */
export const useSound = () => {
  const soundsRef = useRef({});

  // Preload âm thanh
  const preloadSound = useCallback((key, path) => {
    if (!soundsRef.current[key]) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      soundsRef.current[key] = audio;
    }
  }, []);

  // Phát âm thanh
  const playSound = useCallback((key, volume = 0.5) => {
    const audio = soundsRef.current[key];
    if (audio) {
      audio.volume = volume;
      audio.currentTime = 0; // Reset về đầu
      audio.play().catch(err => {
        console.warn(`Không thể phát âm thanh ${key}:`, err);
      });
    }
  }, []);

  // Dừng âm thanh
  const stopSound = useCallback((key) => {
    const audio = soundsRef.current[key];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  return {
    preloadSound,
    playSound,
    stopSound
  };
};

// Preset âm thanh cho game
export const SOUNDS = {
  SHAKE: 'shake',
  BOWL_OPEN: 'bowl-open',
  NEW_ROUND: 'new-round',
  NEW_BET: 'new-bet'
};

export const SOUND_PATHS = {
  [SOUNDS.SHAKE]: '/sounds/shake.mp3',
  [SOUNDS.BOWL_OPEN]: '/sounds/bowl-open.mp3',
  [SOUNDS.NEW_ROUND]: '/sounds/new-round.mp3',
  [SOUNDS.NEW_BET]: '/sounds/new-bet.mp3'
};
