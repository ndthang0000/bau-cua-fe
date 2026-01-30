import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { socket } from '../../socket';
import { useGameStore } from '../../store/useGameStore';
import toast from 'react-hot-toast';

const LAYOUT = [
  { id: 'nai', name: 'Nai', icon: '🦌' },
  { id: 'bau', name: 'Bầu', icon: '🎃' },
  { id: 'ga', name: 'Gà', icon: '🐓' },
  { id: 'ca', name: 'Cá', icon: '🐟' },
  { id: 'cua', name: 'Cua', icon: '🦀' },
  { id: 'tom', name: 'Tôm', icon: '🦐' },
];

// Component cho bet tag có thể kéo để cancel
function DraggableBetTag({ bet, onCancel, isBettingTime }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Tính opacity dựa trên khoảng cách kéo
  const distance = useTransform([x, y], ([latestX, latestY]) => 
    Math.sqrt(latestX * latestX + latestY * latestY)
  );
  const opacity = useTransform(distance, [0, 60], [1, 0.3]);
  const scale = useTransform(distance, [0, 60], [1, 0.8]);

  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    return `${Math.floor(amount / 1000)}K`;
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
    
    // Nếu kéo đủ xa (> 50px), cancel bet
    if (dragDistance > 50 && isBettingTime) {
      onCancel(bet);
    }
  };

  return (
    <motion.div
      drag={isBettingTime}
      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
      dragElastic={0.5}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ x, y, opacity: isDragging ? opacity : 1, scale: isDragging ? scale : 1 }}
      whileTap={{ scale: isBettingTime ? 1.1 : 1 }}
      className={`
        inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold
        bg-gradient-to-r from-red-500 to-red-600 text-white
        shadow-md border border-red-400/50
        ${isBettingTime ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        ${isDragging ? 'z-50 shadow-xl' : 'z-10'}
      `}
    >
      <span className="truncate max-w-[30px]">Tôi</span>
      <span className="text-yellow-300 font-black">{formatAmount(bet.amount)}</span>
      {isDragging && (
        <motion.span 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-0.5 text-white"
        >
          ❌
        </motion.span>
      )}
    </motion.div>
  );
}

// Component hiển thị grouped bets của người khác (tối ưu khi nhiều người đặt)
function GroupedOtherBetsTag({ bets }) {
  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    return `${Math.floor(amount / 1000)}K`;
  };

  if (bets.length === 0) return null;

  // Group bets by user và tính tổng
  const userBets = {};
  bets.forEach(bet => {
    if (!userBets[bet.userId]) {
      userBets[bet.userId] = { nickname: bet.nickname, total: 0, count: 0 };
    }
    userBets[bet.userId].total += bet.amount;
    userBets[bet.userId].count += 1;
  });

  const uniqueUsers = Object.keys(userBets);
  const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  // Nếu có nhiều hơn 2 user, hiển thị tổng hợp
  if (uniqueUsers.length > 2) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold
          bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white
          shadow-sm border border-blue-400/30"
      >
        <span className="text-blue-200">👥{uniqueUsers.length}</span>
        <span className="text-green-300 font-black">{formatAmount(totalAmount)}</span>
      </motion.div>
    );
  }

  // Hiển thị từng user (tối đa 2)
  return (
    <>
      {uniqueUsers.slice(0, 2).map(userId => (
        <motion.div
          key={userId}
          initial={{ opacity: 0, scale: 0.5, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold
            bg-gradient-to-r from-blue-500/80 to-blue-600/80 text-white
            shadow-sm border border-blue-400/30"
        >
          <span className="truncate max-w-[25px]">{userBets[userId].nickname || 'Player'}</span>
          <span className="text-green-300 font-black">{formatAmount(userBets[userId].total)}</span>
        </motion.div>
      ))}
    </>
  );
}

export default function BettingGrid({ isLock, currentBets, myBets, selectedDoors, onSelectDoor, lastResult, status, liveBets = [], myBetRecords = [], onCancelBet }) {
  const { user, room } = useGameStore();
  
  const formatCurrencyShort = (amount) => {
    if (!amount || amount <= 0) return null;
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    return (amount / 1000).toFixed(0) + 'k';
  };

  const isShowResult = status === 'result';
  const isBettingTime = status === 'betting';

  // Group live bets by door
  const betsByDoor = {};
  LAYOUT.forEach(item => {
    betsByDoor[item.id] = {
      others: liveBets.filter(b => b.door === item.id && b.userId !== user.id),
      mine: myBetRecords.filter(b => b.door === item.id)
    };
  });

  const handleCancelBet = (bet) => {
    if (!isBettingTime) {
      toast.error('Chỉ có thể hủy cược trong thời gian đặt cược!');
      return;
    }

    socket.emit('cancel_bet', {
      roomId: room.id,
      betId: bet.betId,
      userId: user.id
    }, (response) => {
      if (response.success) {
        if (onCancelBet) onCancelBet(bet);
        toast.success('Đã hủy cược!');
      } else {
        toast.error(response.message || 'Không thể hủy cược!');
      }
    });
  };

  return (
    <div className={`grid grid-cols-3 gap-2 px-2 mb-4 transition-opacity ${isLock && !isShowResult ? 'opacity-70' : 'opacity-100'}`}>
      {LAYOUT.map((item) => {
        const isSelected = selectedDoors?.includes(item.id);
        const totalBetOnDoor = currentBets?.[item.id] || 0;
        const myBetOnDoor = myBets?.[item.id] || 0;
        const hasPlacedBet = myBetOnDoor > 0;

        const doorBets = betsByDoor[item.id];
        const otherBets = doorBets.others; // Tất cả bets của người khác (sẽ được group)
        const myBetsOnThisDoor = doorBets.mine;

        // TÍNH TOÁN KẾT QUẢ
        const matchCount = isShowResult ? lastResult?.filter(r => r === item.id).length : 0;
        const isMatch = matchCount > 0;
        
        // CHỈ HIỂN THỊ WINNER NẾU USER CÓ ĐẶT CƯỢC VÀO Ô ĐÓ
        const showWinEffect = isShowResult && isMatch && hasPlacedBet;
        const showMultiWin = showWinEffect && matchCount >= 1;

        // ĐỊNH NGHĨA STYLE
        let borderStyle = "border-gray-800";
        let shadowStyle = "";
        let animScale = 1;
        let opacityStyle = "opacity-100";

        if (isShowResult) {
          if (showWinEffect) {
            if (showMultiWin) {
              borderStyle = "border-yellow-400 border-[3px]";
              shadowStyle = "shadow-[0_0_25px_rgba(250,204,21,0.8)]";
              animScale = 1.05;
            } else {
              borderStyle = "border-green-500 border-[3px]";
              shadowStyle = "shadow-[0_0_15px_rgba(34,197,94,0.6)]";
            }
          } else if (isMatch && !hasPlacedBet) {
            borderStyle = "border-green-500/30 opacity-80";
          } else {
            borderStyle = "border-gray-800";
            opacityStyle = "opacity-30 grayscale";
            animScale = 0.95;
          }
        } else if (isSelected) {
          borderStyle = "border-yellow-400 bg-yellow-400/10";
        }

        return (
          <motion.div
            key={item.id}
            animate={{ scale: animScale }}
            onClick={() => !isLock && onSelectDoor(item.id)}
            className={`relative aspect-square rounded-[20px] border-2 flex flex-col items-center justify-center transition-all duration-500 overflow-visible shadow-xl cursor-pointer
              ${borderStyle} ${shadowStyle} ${opacityStyle}
              ${!isShowResult && !isSelected ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] active:scale-95' : ''}
              ${showWinEffect ? 'bg-white/5' : ''}
            `}
          >
            {/* CHỈ HIỂN THỊ SỐ NHÂN NẾU USER CÓ ĐẶT VÀ TRÚNG */}
            {showMultiWin && (
              <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[10px] font-black px-1.5 rounded-br-lg z-20 animate-bounce">
                X{matchCount}
              </div>
            )}

            {/* TỔNG CƯỢC CẢ LÀNG */}
            <div className="absolute top-1.5 right-2 flex flex-col items-end z-10">
              <span className="text-[7px] text-blue-400/60 uppercase font-bold leading-none">Tổng</span>
              <span className="text-[9px] font-black text-blue-400">{formatCurrencyShort(totalBetOnDoor) || '0'}</span>
            </div>

            {/* Dấu Tick khi đang chọn */}
            {isSelected && !isShowResult && (
              <div className="absolute top-1.5 left-2 bg-yellow-400 rounded-full w-4 h-4 flex items-center justify-center">
                <span className="text-[10px] font-black text-black">✓</span>
              </div>
            )}

            {/* Icon và Tên */}
            <span className={`text-3xl mb-0.5 transition-all duration-700 ${showWinEffect ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-bold uppercase ${showWinEffect ? 'text-yellow-400' : (isMatch && isShowResult) ? 'text-green-400/70' : 'text-gray-500'}`}>
              {item.name}
            </span>

            {/* BET TAGS CONTAINER - Hiển thị tất cả bet tags */}
            <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 justify-center items-end max-h-[40px] overflow-hidden pointer-events-auto">
              <AnimatePresence mode="popLayout">
                {/* Bet tags của người khác - grouped */}
                <GroupedOtherBetsTag bets={otherBets} />
                
                {/* Bet tags của mình - có thể kéo để cancel */}
                {myBetsOnThisDoor.map((bet, idx) => (
                  <DraggableBetTag 
                    key={bet.betId || `mine-${idx}`} 
                    bet={bet}
                    onCancel={handleCancelBet}
                    isBettingTime={isBettingTime}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Overlay khi bị khóa (chỉ phase xóc) */}
            {status === 'shaking' && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-[18px]">
                <span className="text-[8px] font-bold text-white/50 tracking-tighter uppercase rotate-[-12deg]">Đang xóc...</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}