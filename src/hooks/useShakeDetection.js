import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook để phát hiện lắc điện thoại
 * Sử dụng DeviceMotionEvent API
 * 
 * @param {Object} options
 * @param {number} options.threshold - Ngưỡng gia tốc để xem như "lắc" (mặc định: 15)
 * @param {number} options.stopDelay - Thời gian dừng lắc để kích hoạt callback (ms, mặc định: 2000)
 * @param {Function} options.onShake - Callback khi đang lắc
 * @param {Function} options.onShakeStop - Callback khi dừng lắc sau stopDelay
 * @param {boolean} options.enabled - Bật/tắt detection
 */
export const useShakeDetection = ({
  threshold = 15,
  stopDelay = 2000,
  onShake,
  onShakeStop,
  enabled = true
}) => {
  const isShakingRef = useRef(false);
  const lastShakeTimeRef = useRef(0);
  const stopTimerRef = useRef(null);
  const hasPermissionRef = useRef(false);

  // Request permission cho iOS 13+
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        hasPermissionRef.current = permission === 'granted';
        return permission === 'granted';
      } catch (error) {
        console.error('Không thể xin quyền motion:', error);
        return false;
      }
    }
    // Android hoặc iOS cũ không cần permission
    hasPermissionRef.current = true;
    return true;
  }, []);

  // Xử lý motion event
  const handleMotion = useCallback((event) => {
    if (!enabled) return;

    const { accelerationIncludingGravity } = event;
    if (!accelerationIncludingGravity) return;

    const { x, y, z } = accelerationIncludingGravity;

    // Tính tổng gia tốc (magnitude)
    const acceleration = Math.sqrt(x * x + y * y + z * z);

    // Debug log mỗi 1s
    const now = Date.now();
    if (now - lastShakeTimeRef.current > 1000) {
      console.log('📱 Acceleration:', acceleration.toFixed(2), '| Threshold:', threshold);
    }

    // Phát hiện lắc mạnh
    if (acceleration > threshold) {
      console.log('🎯 SHAKE DETECTED! Acceleration:', acceleration.toFixed(2));

      // Ngăn spam: chỉ trigger mỗi 100ms
      if (now - lastShakeTimeRef.current > 100) {
        lastShakeTimeRef.current = now;

        if (!isShakingRef.current) {
          isShakingRef.current = true;
          onShake?.();
        }

        // Clear timer cũ nếu vẫn đang lắc
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
        }

        // Set timer mới để phát hiện "dừng lắc"
        stopTimerRef.current = setTimeout(() => {
          if (isShakingRef.current) {
            isShakingRef.current = false;
            onShakeStop?.();
          }
        }, stopDelay);
      }
    }
  }, [enabled, threshold, stopDelay, onShake, onShakeStop]);

  useEffect(() => {
    if (!enabled) {
      console.log('🚫 Shake detection DISABLED');
      return;
    }

    console.log('✅ Shake detection ENABLED - registering listener...');

    // Đảm bảo có permission trước
    requestPermission().then(granted => {
      if (granted) {
        console.log('✅ Motion permission granted - adding event listener');
        window.addEventListener('devicemotion', handleMotion);
      } else {
        console.warn('❌ Motion permission denied');
      }
    });

    return () => {
      console.log('🧹 Cleaning up shake detection');
      window.removeEventListener('devicemotion', handleMotion);
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
    };
  }, [enabled, handleMotion, requestPermission]);

  return {
    requestPermission,
    isShaking: isShakingRef.current
  };
};
