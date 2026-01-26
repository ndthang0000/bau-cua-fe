import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export default function LeaderboardModal({ isOpen, onClose }) {
  const { roomMembers, user } = useGameStore();

  // Sắp xếp danh sách theo số dư giảm dần
  const sortedMembers = [...roomMembers].sort((a, b) => b.currentBalance - a.currentBalance);
  
  // Tìm vị trí của bản thân
  const myRank = sortedMembers.findIndex(m => m.userId === user.id) + 1;
  const me = roomMembers.find(m => m.userId === user.id);

  useEffect(() => {
      if (isOpen) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
      return () => document.body.classList.remove('modal-open');
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay nền mờ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            drag="y" // Cho phép kéo theo trục Y
            dragConstraints={{ top: 0 }} // Không cho kéo lên trên quá mức
            dragElastic={0.2} // Độ co giãn khi kéo
            onDragEnd={(event, info) => {
              // Nếu kéo xuống hơn 100px thì đóng Modal
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#121212] rounded-t-[40px] z-[101] flex flex-col h-[90dvh] touch-none"
          >
            {/* Handle bar cho cảm giác vuốt */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />

            {/* Header */}
            <div className="p-6 pb-2">
              <h2 className="text-center text-white text-2xl font-black uppercase tracking-widest">
                Bảng Xếp Hạng
              </h2>
              
              
            </div>

            {/* Danh sách cuộn */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
              {sortedMembers.map((member, index) => (
                <RankItem 
                  key={member.userId} 
                  rank={index + 1} 
                  member={member} 
                  isMe={member.userId === user.id}
                />
              ))}
            </div>

            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sub-component cho từng item xếp hạng
function RankItem({ rank, member, isMe }) {
  const isTop3 = rank <= 3;
  const rankColors = {
    1: 'bg-yellow-400 text-black shadow-yellow-500/50',
    2: 'bg-gray-300 text-black shadow-gray-400/50',
    3: 'bg-orange-600 text-white shadow-orange-700/50',
  };

  return (
    <div className={`flex items-center gap-4 py-2 ${isMe ? 'opacity-50' : ''}`}>
      {/* Rank Number */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg
        ${isTop3 ? rankColors[rank] : 'text-gray-600 bg-white/5'}`}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="relative">
        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl
          ${rank === 1 ? 'border-yellow-400' : 'border-white/10'} bg-gray-900 shadow-xl`}>
          {member.avatar}
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#121212] rounded-full" />
      </div>

      {/* Name & Balance */}
      <div className="flex-1">
        <p className="text-white font-bold text-sm tracking-tight">{member.nickname}</p>
        <p className="text-yellow-500/80 font-black text-xs">
          {member.currentBalance.toLocaleString()}
        </p>
      </div>

      {/* Profit Percent */}
      <div className={`px-2 py-1 rounded-lg text-[10px] font-black 
        ${member.currentBalance >= member.initBalance ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {member.currentBalance >= member.initBalance ? '+' : ''}
        {Math.round(((member.currentBalance - member.initBalance) / member.initBalance) * 100)}%
      </div>
    </div>
  );
}