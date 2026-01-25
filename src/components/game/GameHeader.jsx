import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const ICONS = {
  bau: '🎃', cua: '🦀', ca: '🐟', ga: '🐓', tom: '🦐', nai: '🦌'
};

const STATUS_TEXT = {
  waiting: 'Chờ bắt đầu...',
  betting: 'Đang đặt cược...',
  shaking: 'Đang xóc đĩa...',
  result: 'Đang mở bát...'
};

export default function GameHeader({ onPressSoiCau }) {
  const { room, history } = useGameStore();
  
  // State để lưu kết quả hiển thị trên Header (nhằm tạo delay)
  const [displayResult, setDisplayResult] = useState(history[0]?.result || []);
  // Logic Delay cập nhật kết quả ván gần nhất
  useEffect(() => {
    if (room?.status === 'result') {
      // Đợi 2 giây (khớp với nhịp nắp bát nhích ra) rồi mới cập nhật Header
      const timer = setTimeout(() => {
        setDisplayResult(history[0]?.result || []);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [room?.status, history[0]]);

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col">
          <span className="font-black text-lg">Room #{room?.id}</span>
          <span className={`text-[9px] uppercase tracking-widest font-bold ${
            room?.status === 'betting' ? 'text-green-500' : 'text-gray-500'
          }`}>
            {STATUS_TEXT[room?.status] || 'Đang kết nối...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Kết quả ván gần nhất (Đã được delay) */}
          <div className="flex gap-1 bg-black/40 p-1.5 rounded-full border border-gray-800">
            {[0, 1, 2].map((idx) => (
              <span 
                key={idx} 
                className="w-5 h-5 flex items-center justify-center text-[10px] bg-white rounded-full transition-all duration-500 shadow-inner"
              >
                {ICONS[displayResult[idx]] || '?'}
              </span>
            ))}
          </div>
          
          <button 
            onClick={onPressSoiCau} 
            className="text-red-500 font-black text-[11px] px-2 py-1 bg-red-500/10 rounded-md active:scale-95 transition-transform"
          >
            SOI CẦU
          </button>
        </div>
      </div>
    </div>
  );
}