import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../socket';
import { useGameStore } from '../../store/useGameStore';
import toast from 'react-hot-toast';

const DOOR_INFO = {
  nai: { name: 'Nai', icon: '🦌' },
  bau: { name: 'Bầu', icon: '🎃' },
  ga: { name: 'Gà', icon: '🐓' },
  ca: { name: 'Cá', icon: '🐟' },
  cua: { name: 'Cua', icon: '🦀' },
  tom: { name: 'Tôm', icon: '🦐' },
};

export default function MyBetsPanel({ isOpen, onClose }) {
  const { room, user, myBetRecords, removeBetRecord, myBets, addMyBet } = useGameStore();
  
  const isBettingTime = room?.status === 'betting';

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    return `${Math.floor(amount / 1000)}K`;
  };

  const handleCancelBet = (betRecord) => {
    if (!isBettingTime) {
      toast.error('Chỉ có thể hủy cược trong thời gian đặt cược!');
      return;
    }

    socket.emit('cancel_bet', {
      roomId: room.id,
      betId: betRecord.betId,
      userId: user.id
    }, (response) => {
      if (response.success) {
        // Xóa bet record khỏi store
        removeBetRecord(betRecord.betId);
        // Cập nhật lại myBets (trừ đi số tiền đã hủy)
        addMyBet(betRecord.door, -betRecord.amount);
        toast.success('Đã hủy cược thành công!');
      } else {
        toast.error(response.message || 'Không thể hủy cược!');
      }
    });
  };

  const totalBetAmount = myBetRecords.reduce((sum, bet) => sum + bet.amount, 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-t-3xl border-t border-gray-700 max-h-[70vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <h3 className="text-white font-bold">Cược của bạn</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-yellow-500 font-bold">
                Tổng: {formatCurrency(totalBetAmount)}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Bet List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {myBetRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">🎲</span>
                <p>Bạn chưa đặt cược nào</p>
              </div>
            ) : (
              myBetRecords.map((bet, index) => (
                <motion.div
                  key={bet.betId || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between bg-gray-900/60 rounded-xl p-3 border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
                      {DOOR_INFO[bet.door]?.icon || '❓'}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {DOOR_INFO[bet.door]?.name || bet.door}
                      </p>
                      <p className="text-yellow-500 font-bold text-xs">
                        {formatCurrency(bet.amount)}
                      </p>
                    </div>
                  </div>
                  
                  {isBettingTime && (
                    <button
                      onClick={() => handleCancelBet(bet)}
                      className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-xs font-bold hover:bg-red-500/30 active:scale-95 transition-all"
                    >
                      Hủy
                    </button>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Note */}
          {!isBettingTime && myBetRecords.length > 0 && (
            <div className="p-4 border-t border-gray-800">
              <p className="text-center text-xs text-gray-500">
                ⚠️ Chỉ có thể hủy cược trong thời gian đặt cược
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
