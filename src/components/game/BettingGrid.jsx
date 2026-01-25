import React from 'react';

const LAYOUT = [
  { id: 'nai', name: 'Nai', icon: '🦌' },
  { id: 'bau', name: 'Bầu', icon: '🎃' },
  { id: 'ga', name: 'Gà', icon: '🐓' },
  { id: 'ca', name: 'Cá', icon: '🐟' },
  { id: 'cua', name: 'Cua', icon: '🦀' },
  { id: 'tom', name: 'Tôm', icon: '🦐' },
];

// Thêm props myBets để hiển thị cược cá nhân
export default function BettingGrid({ isLock, currentBets, myBets, selectedDoors, onSelectDoor }) {
  
  const formatCurrencyShort = (amount) => {
    if (!amount || amount <= 0) return null;
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    return (amount / 1000).toFixed(0) + 'k';
  };

  return (
    <div className={`grid grid-cols-3 gap-2 px-2 mb-4 transition-opacity ${isLock ? 'opacity-70' : 'opacity-100'}`}>
      {LAYOUT.map((item) => {
        const isSelected = selectedDoors?.includes(item.id);
        const totalBetOnDoor = currentBets?.[item.id] || 0;
        const myBetOnDoor = myBets?.[item.id] || 0; // Tiền cược của bản thân

        return (
          <button
            key={item.id}
            disabled={isLock}
            onClick={() => onSelectDoor(item.id)}
            className={`relative aspect-square rounded-[20px] border-2 flex flex-col items-center justify-center transition-all duration-200 shadow-xl overflow-hidden
              ${isSelected 
                ? 'border-yellow-400 bg-yellow-400/10 scale-[0.98] shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                : 'border-gray-800 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] active:scale-95'
              }`}
          >
            {/* 1. TỔNG CƯỢC CẢ LÀNG (Góc trên bên phải - Màu Xanh) */}
            <div className="absolute top-1.5 right-2 flex flex-col items-end">
              <span className="text-[7px] text-blue-400/60 uppercase font-bold leading-none mb-0.5">Tổng</span>
              <span className="text-[9px] font-black text-blue-400 leading-none">
                {formatCurrencyShort(totalBetOnDoor) || '0'}
              </span>
            </div>

            {/* 2. CƯỢC CỦA BẠN (Góc dưới bên phải - Màu Đỏ/Cam để nổi bật) */}
            {myBetOnDoor > 0 && (
              <div className="absolute bottom-1.5 right-2 flex flex-col items-end bg-red-500/10 px-1 rounded-sm border border-red-500/20">
                <span className="text-[7px] text-red-500 uppercase font-black leading-none mb-0.5 text-[6px]">Bạn</span>
                <span className="text-[9px] font-black text-red-500 leading-none">
                  {formatCurrencyShort(myBetOnDoor)}
                </span>
              </div>
            )}

            {/* 3. Dấu Tick khi đang chọn (Góc trên bên trái) */}
            {isSelected && (
              <div className="absolute top-1.5 left-2 bg-yellow-400 rounded-full w-4 h-4 flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                <span className="text-[10px] font-black text-black">✓</span>
              </div>
            )}

            {/* 4. Hình ảnh và Tên */}
            <span className={`text-4xl mb-0.5 transition-transform ${isSelected ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`}>
              {item.name}
            </span>

            {/* 5. Khóa khi hết thời gian */}
            {isLock && (
              <div className="absolute inset-0 bg-black/20 backdrop-grayscale-[0.5]" />
            )}
          </button>
        );
      })}
    </div>
  );
}