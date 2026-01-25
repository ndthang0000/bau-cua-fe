import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

const FAIL_MESSAGES = [
  "Đồng tiền đi trước là đồng tiền... không khôn :(",
  "Thất bại là mẹ của... thua cuộc",
  "Thất bại ở đâu, gấp đôi ở đó",
  "Gió tầng nào gặp mây tầng đó, hụt cửa này thì mình bỏ cửa kia",
  "Ví của bạn đang bật chế độ... tiết kiệm cưỡng bức",
  "Nghèo thì lâu chứ giàu thì mấy chốc... ván sau gỡ lại nha",
  "Cái nết đánh đề, ra đê mà ở... nhưng đây là Bầu Cua!",
  "Đen tình đỏ bạc, mà bạn đen cả hai thì... buồn thật",
  "Linh vật này không yêu bạn rồi, đổi phong thủy đi",
  "Tiền chỉ là phù du, nhưng hụt tiền là phù mỏ..."
];

export default function WinEffect({ winData }) {
  // winData: { winAmount: 100000, isVisible: true }
  
  useEffect(() => {
    if (winData.isVisible && winData.winAmount > 0) {
      // Bắn pháo hoa
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#fbbf24', '#f59e0b', '#ffffff']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#fbbf24', '#f59e0b', '#ffffff']
        });

        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }, [winData.isVisible]);

  return (
    <AnimatePresence>
      {winData.isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          {winData.winAmount > 0 ? (
            // HIỆU ỨNG THẮNG
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-gradient-to-b from-yellow-300 to-yellow-600 bg-clip-text text-transparent text-6xl font-black drop-shadow-2xl"
              >
                + {winData.winAmount.toLocaleString()}
              </motion.div>
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="text-white font-bold tracking-widest mt-2 bg-black/50 px-4 py-1 rounded-full border border-yellow-500/50"
              >
                💰 TIỀN ĐÃ VỀ TÚI 💰
              </motion.div>
            </motion.div>
          ) : (
            // HIỆU ỨNG THẤT BẠI (CHIA BUỒN)
            <motion.div
              initial={{ opacity: 0, filter: 'grayscale(1)' }}
              animate={{ opacity: 1, filter: 'grayscale(0)' }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <span className="text-6xl text-gray-400">💸</span>
              <p className="text-gray-400 font-bold mt-4 italic text-sm px-5">{FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]}</p>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}