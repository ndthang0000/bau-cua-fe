import React from 'react';
import { motion } from 'framer-motion';

const LAYOUT = [
  { id: 'nai', name: 'Nai', icon: '🦌' },
  { id: 'bau', name: 'Bầu', icon: '🎃' },
  { id: 'ga', name: 'Gà', icon: '🐓' },
  { id: 'ca', name: 'Cá', icon: '🐟' },
  { id: 'cua', name: 'Cua', icon: '🦀' },
  { id: 'tom', name: 'Tôm', icon: '🦐' },
];

export default function BettingGrid({ isLock, currentBets, myBets, selectedDoors, onSelectDoor, lastResult, status }) {
  
  const formatCurrencyShort = (amount) => {
    if (!amount || amount <= 0) return null;
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    return (amount / 1000).toFixed(0) + 'k';
  };

  const isShowResult = status === 'result';

  return (
    <div className={`grid grid-cols-3 gap-2 px-2 mb-4 transition-opacity ${isLock && !isShowResult ? 'opacity-70' : 'opacity-100'}`}>
      {LAYOUT.map((item) => {
        const isSelected = selectedDoors?.includes(item.id);
        const totalBetOnDoor = currentBets?.[item.id] || 0;
        const myBetOnDoor = myBets?.[item.id] || 0;

        // TÍNH TOÁN KẾT QUẢ
        // Đếm số lần linh vật xuất hiện trong kết quả (0, 1, 2, 3)
        const matchCount = isShowResult ? lastResult?.filter(r => r === item.id).length : 0;
        const isLoser = isShowResult && matchCount === 0;
        const isSingleWin = isShowResult && matchCount === 1;
        const isMultiWin = isShowResult && matchCount >= 2;

        // ĐỊNH NGHĨA STYLE VIỀN THEO KẾT QUẢ
        let borderStyle = "border-gray-800";
        let shadowStyle = "";
        let animScale = 1;

        if (isShowResult) {
          if (isMultiWin) {
             borderStyle = "border-yellow-400 border-[3px]";
             shadowStyle = "shadow-[0_0_25px_rgba(250,204,21,0.8)]";
             animScale = 1.05;
          } else if (isSingleWin) {
             borderStyle = "border-green-500 border-[3px]";
             shadowStyle = "shadow-[0_0_15px_rgba(34,197,94,0.6)]";
          } else if (isLoser) {
             borderStyle = "border-red-600 opacity-40 scale-95";
          }
        } else if (isSelected) {
          borderStyle = "border-yellow-400 bg-yellow-400/10";
        }

        return (
          <motion.button
            key={item.id}
            disabled={isLock}
            onClick={() => onSelectDoor(item.id)}
            animate={{ scale: animScale }}
            className={`relative aspect-square rounded-[20px] border-2 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden shadow-xl
              ${borderStyle} ${shadowStyle}
              ${!isShowResult && !isSelected ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] active:scale-95' : ''}
              ${(isMultiWin || isSingleWin) ? 'bg-white/5' : ''}
            `}
          >
            {/* HIỆN SỐ NHÂN (X2, X3) KHI TRÚNG LỚN */}
            {isMultiWin && (
              <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[10px] font-black px-1.5 rounded-br-lg z-20 animate-bounce">
                X{matchCount}
              </div>
            )}

            {/* 1. TỔNG CƯỢC CẢ LÀNG */}
            <div className="absolute top-1.5 right-2 flex flex-col items-end z-10">
              <span className="text-[7px] text-blue-400/60 uppercase font-bold leading-none">Tổng</span>
              <span className="text-[9px] font-black text-blue-400">{formatCurrencyShort(totalBetOnDoor) || '0'}</span>
            </div>

            {/* 2. CƯỢC CỦA BẠN */}
            {myBetOnDoor > 0 && (
              <div className={`absolute bottom-1.5 right-2 flex flex-col items-end px-1 rounded-sm border z-10
                ${isLoser ? 'bg-gray-500/10 border-gray-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className={`text-[6px] font-black uppercase leading-none ${isLoser ? 'text-gray-500' : 'text-red-500'}`}>Bạn</span>
                <span className={`text-[9px] font-black ${isLoser ? 'text-gray-500' : 'text-red-500'}`}>{formatCurrencyShort(myBetOnDoor)}</span>
              </div>
            )}

            {/* 3. Dấu Tick khi đang chọn */}
            {isSelected && !isShowResult && (
              <div className="absolute top-1.5 left-2 bg-yellow-400 rounded-full w-4 h-4 flex items-center justify-center">
                <span className="text-[10px] font-black text-black">✓</span>
              </div>
            )}

            {/* 4. Icon và Tên */}
            <span className={`text-4xl mb-0.5 transition-all duration-700 
              ${isMultiWin ? 'scale-125 rotate-12' : isLoser ? 'grayscale opacity-30' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-bold uppercase ${isMultiWin ? 'text-yellow-400' : isSingleWin ? 'text-green-400' : 'text-gray-500'}`}>
              {item.name}
            </span>

            {/* 5. Overlay khi bị khóa (chỉ phase xóc) */}
            {status === 'shaking' && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-[8px] font-bold text-white/50 tracking-tighter uppercase rotate-[-12deg]">Đang xóc...</span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}