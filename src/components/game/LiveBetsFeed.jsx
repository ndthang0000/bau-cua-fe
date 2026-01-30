import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useEffect, useState } from 'react';

const DOOR_INFO = {
  nai: { name: 'Nai', icon: '🦌', color: '#F59E0B' },
  bau: { name: 'Bầu', icon: '🎃', color: '#F97316' },
  ga: { name: 'Gà', icon: '🐓', color: '#EF4444' },
  ca: { name: 'Cá', icon: '🐟', color: '#3B82F6' },
  cua: { name: 'Cua', icon: '🦀', color: '#EC4899' },
  tom: { name: 'Tôm', icon: '🦐', color: '#8B5CF6' },
};

export default function LiveBetsFeed() {
  const { liveBets, user } = useGameStore();
  const [visibleBets, setVisibleBets] = useState([]);

  // Chỉ hiện 5 bet gần nhất, tự động ẩn sau 5s
  useEffect(() => {
    if (liveBets.length > 0) {
      const latestBet = liveBets[liveBets.length - 1];
      
      // Không hiện bet của chính mình
      if (latestBet.userId === user.id) return;
      
      // Thêm bet mới với unique key
      const betWithKey = { ...latestBet, key: Date.now() + Math.random() };
      setVisibleBets(prev => [...prev.slice(-4), betWithKey]);

      // Auto remove after 4 seconds
      setTimeout(() => {
        setVisibleBets(prev => prev.filter(b => b.key !== betWithKey.key));
      }, 4000);
    }
  }, [liveBets, user.id]);

  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    return `${Math.floor(amount / 1000)}K`;
  };

  return (
    <div className="fixed top-20 left-2 z-50 flex flex-col gap-1.5 pointer-events-none max-w-[180px]">
      <AnimatePresence mode="popLayout">
        {visibleBets.map((bet) => (
          <motion.div
            key={bet.key}
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md rounded-full pl-1 pr-2 py-1 border border-gray-700/50 shadow-lg"
          >
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs flex-shrink-0">
              {bet.avatar || '👤'}
            </div>
            
            {/* Info */}
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[10px] text-gray-300 truncate max-w-[50px]">
                {bet.nickname || 'Player'}
              </span>
              <span className="text-[10px] text-gray-500">→</span>
              <span className="text-sm">{DOOR_INFO[bet.door]?.icon}</span>
              <span 
                className="text-[10px] font-bold"
                style={{ color: DOOR_INFO[bet.door]?.color || '#fff' }}
              >
                {formatAmount(bet.amount)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
