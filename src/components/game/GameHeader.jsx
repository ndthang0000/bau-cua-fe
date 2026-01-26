import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, History } from 'lucide-react'; // Thay BarChart2 bằng Search

const ICONS = {
  bau: '🎃', cua: '🦀', ca: '🐟', ga: '🐓', tom: '🦐', nai: '🦌'
};

const STATUS_TEXT = {
  waiting: 'Chờ bắt đầu...',
  betting: 'Đang đặt cược...',
  shaking: 'Đang xóc đĩa...',
  result: 'Đang mở bát...'
};

export default function GameHeader({ onPressSoiCau, onPressLeaderboard, onPressBetHistory }) {
  const { room, history } = useGameStore();
  const [displayResult, setDisplayResult] = useState(history[0]?.result || []);

  useEffect(() => {
    if (room?.status === 'result') {
      const timer = setTimeout(() => {
        setDisplayResult(history[0]?.result || []);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [room?.status, history[0]]);

  return (
    <div className="p-3 flex flex-col items-center">
      <div className="w-full flex justify-between items-center gap-2">
        
        {/* NHÓM TRÁI: Thông tin phòng & Status */}
        <div className="flex flex-col min-w-[90px]">
          <span className="font-black text-sm leading-none">PHÒNG #{room?.id}</span>
          <span className={`text-[8px] uppercase tracking-widest font-bold mt-1 ${
            room?.status === 'betting' ? 'text-green-500' : 'text-gray-400'
          }`}>
            {STATUS_TEXT[room?.status] || 'Kết nối...'}
          </span>
        </div>

        {/* NHÓM GIỮA: Kết quả cũ & Nút Soi Cầu (Đưa lại gần nhau) */}
        <div className="flex items-center gap-1 bg-black/40 p-1.5 rounded-full border border-gray-800">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((idx) => (
              <span 
                key={idx} 
                className="w-6 h-6 flex items-center justify-center text-[10px] bg-white rounded-full transition-all duration-500 shadow-inner"
              >
                {ICONS[displayResult[idx]] || '?'}
              </span>
            ))}
          </div>
          
          {/* Nút Soi Cầu đặt cạnh kết quả */}
          <button 
            onClick={onPressSoiCau} 
            className="text-red-500 font-black text-[11px] px-2 py-1 bg-red-500/10 rounded-md active:scale-95 transition-transform"
            title="Soi cầu"
          >
            Soi cầu
          </button>
        </div>
        
        {/* NHÓM PHẢI: Leaderboard & Lịch sử cược */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onPressLeaderboard}
            className="p-2 bg-amber-100 text-amber-600 rounded-xl active:scale-90 transition-transform border border-amber-200"
            title="Bảng xếp hạng"
          >
            <Trophy size={18} strokeWidth={2.5} />
          </button>

          <button 
            onClick={onPressBetHistory}
            className="p-2 bg-blue-100 text-blue-600 rounded-xl active:scale-90 transition-transform border border-blue-200"
            title="Lịch sử cược"
          >
            <History size={18} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  );
}